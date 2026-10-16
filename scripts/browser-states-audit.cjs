const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
mkdirSync('audit-results/current/screenshots', { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const base = process.env.AUDIT_URL || 'http://127.0.0.1:5174';
  const checks = [], injected = new WeakSet(), expectedFailures = [], unexpectedFailures = [], runtimeErrors = [], consoleErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ message: message.text(), url: message.location().url }); });
  page.on('response', response => {
    if (response.status() >= 400) (injected.has(response.request()) ? expectedFailures : unexpectedFailures).push({ method: response.request().method(), url: response.url(), status: response.status() });
  });
  page.on('requestfailed', request => (injected.has(request) ? expectedFailures : unexpectedFailures).push({ method: request.method(), url: request.url(), error: request.failure()?.errorText }));
  const visibleButton = name => page.getByRole('button', { name, exact: true }).filter({ visible: true });
  const visibleLink = name => page.getByRole('link', { name, exact: true }).filter({ visible: true });
  const text = value => page.getByText(value, { exact: true }).first().waitFor();
  const email = `states-${Date.now()}@example.com`, password = 'AuditPassword123!';
  async function login(destination = '/dashboard') {
    await page.goto(base + '/login');
    await page.locator('[name=email]').fill(email);
    await page.locator('[name=password]').fill(password);
    await visibleButton('Sign in').click();
    await page.waitForURL(`**${destination}`);
  }
  // Capture an exact request; release it after assertions on its pending UI.
  async function hold(pattern, method, outcome) {
    let release, arrived;
    const gate = new Promise(resolve => { release = resolve; });
    const seen = new Promise(resolve => { arrived = resolve; });
    const handler = async route => {
      if (route.request().method() !== method) return route.continue();
      arrived();
      await gate;
      if (outcome) {
        injected.add(route.request());
        if (outcome === 'offline') await route.abort('failed');
        else await route.fulfill({ status: outcome.status || 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: outcome.message }) });
      } else await route.continue();
    };
    await page.route(pattern, handler);
    return { seen, release, clear: () => page.unroute(pattern, handler) };
  }
  async function verifyDashboard() {
    await page.goto(base + '/dashboard');
    const stats = await page.evaluate(async () => {
      const response = await fetch('http://localhost:5055/api/tasks/stats', {headers:{Authorization:`Bearer ${localStorage.getItem('taskflow_token')}`}});
      if (!response.ok) throw new Error('Stats request failed');
      return (await response.json()).data;
    });
    for (const [label,key] of Object.entries({'Total Tasks':'total','Pending':'pending','In Progress':'inProgress','Completed':'completed'})) {
      const card = page.getByText(label,{exact:true}).locator('..');
      await card.locator('p').nth(1).filter({hasText:new RegExp(`^${stats[key]}$`)}).waitFor();
    }
    await page.screenshot({path:'audit-results/current/screenshots/dashboard.png',fullPage:true});
    await page.goto(base + '/tasks'); await text(stats.total ? '1 / 1' : 'No tasks found');
  }
  try {
    await page.goto(base + '/register');
    await visibleLink('Sign in').click(); await page.waitForURL('**/login');
    await visibleButton('Sign in').click(); await text('Email and password are required.');
    await visibleLink('Create one').click(); await page.waitForURL('**/register');
    await visibleButton('Create account').click(); await text('Please complete all fields.');
    await page.locator('[name=name]').fill('States Auditor'); await page.locator('[name=email]').fill(email);
    await page.locator('[name=password]').fill('short'); await page.locator('[name=confirmPassword]').fill('short');
    await visibleButton('Create account').click(); await text('Password must be at least 8 characters long.');
    await page.locator('[name=password]').fill(password); await page.locator('[name=confirmPassword]').fill('different-password');
    await visibleButton('Create account').click(); await text('Passwords do not match.');
    await page.locator('[name=confirmPassword]').fill(password);
    for (const [index, field] of ['password', 'confirmPassword'].entries()) {
      await page.locator('form button[type=button]').nth(index).click(); assert.equal(await page.locator(`[name=${field}]`).getAttribute('type'), 'text');
      await page.locator('form button[type=button]').nth(index).click(); assert.equal(await page.locator(`[name=${field}]`).getAttribute('type'), 'password');
    }
    const registration = await hold('**/api/auth/register', 'POST', { message: 'Injected registration failure' });
    await visibleButton('Create account').click(); await registration.seen;
    assert.equal(await visibleButton('Creating account...').isDisabled(), true);
    registration.release(); await text('Injected registration failure'); await registration.clear();
    await visibleButton('Create account').click(); await page.waitForURL('**/dashboard');
    await text('No tasks yet. Create your first task to get started.');
    checks.push('auth links, missing/short/mismatched fields, both registration password toggles, registration pending/failure/retry');

    await visibleButton('Logout').click(); await page.waitForURL('**/login');
    await page.locator('[name=email]').fill(email); await page.locator('[name=password]').fill(password);
    const signIn = await hold('**/api/auth/login', 'POST', 'offline');
    await visibleButton('Sign in').click(); await signIn.seen;
    assert.equal(await visibleButton('Signing in...').isDisabled(), true);
    signIn.release(); await text('Unable to sign in. Please try again.'); await signIn.clear();
    await visibleButton('Sign in').click(); await page.waitForURL('**/dashboard');
    checks.push('desktop dashboard logout; login pending/network-error/retry');

    const dashboard = await hold('**/api/tasks/stats', 'GET', { message: 'Injected dashboard failure' });
    await page.reload(); await dashboard.seen; await text('Loading tasks...');
    dashboard.release(); await text('Injected dashboard failure'); await dashboard.clear();
    assert.equal(await page.getByText('No tasks yet. Create your first task to get started.', { exact: true }).count(), 0);
    await page.reload(); await text('No tasks yet. Create your first task to get started.');
    await visibleLink('Dashboard').click(); await visibleLink('Tasks').click(); await page.waitForURL('**/tasks');
    const list = await hold('**/api/tasks?*', 'GET', 'offline');
    await page.reload(); await list.seen; await text('Loading tasks...'); list.release();
    await text('Unable to load tasks. Please try again.'); await list.clear();
    assert.equal(await page.getByText('No tasks found', { exact: true }).count(), 0);
    await page.reload(); await text('No tasks found');
    checks.push('dashboard/list loading, empty, HTTP/network failure, and recovery; desktop navigation');

    await visibleButton('Create task').click();
    await page.getByRole('button', { name: '✕', exact: true }).click(); assert.equal(await page.locator('form').count(), 0);
    await visibleButton('Create task').click();
    await page.locator('form input').first().fill('Stateful task'); await page.locator('form textarea').fill('Description from browser');
    await page.locator('form select').nth(0).selectOption('in-progress'); await page.locator('form select').nth(1).selectOption('high');
    const create = await hold('**/api/tasks', 'POST', { message: 'Injected create failure' });
    await page.locator('form button[type=submit]').click(); await create.seen; assert.equal(await visibleButton('Saving...').isDisabled(), true); assert.equal(await visibleButton('Cancel').isDisabled(), true); create.release();
    await page.getByRole('alert').filter({ hasText: 'Injected create failure' }).waitFor(); await create.clear();
    assert.equal(await page.locator('form input').first().inputValue(), 'Stateful task');
    await page.locator('form button[type=submit]').click(); await page.locator('form').waitFor({ state: 'hidden' }); await text('Stateful task');
    await verifyDashboard();
    await page.reload(); await text('Stateful task');
    await page.getByLabel('View task details',{exact:true}).click();
    await text('Description from browser');
    await page.screenshot({path:'audit-results/current/screenshots/task-details.png',fullPage:true});
    await visibleButton('Close details').click();
    const detailFailure = await hold('**/api/tasks/*','GET',{message:'Injected details failure'});
    await page.getByLabel('View task details',{exact:true}).click(); await detailFailure.seen;
    await text('Loading task details...'); detailFailure.release(); await text('Injected details failure'); await detailFailure.clear();
    await visibleButton('Close details').click();
    const row = page.locator('tbody tr').filter({ hasText: 'Stateful task' });
    assert.match(await row.innerText(), /in-progress/); assert.match(await row.innerText(), /high/);
    await page.getByLabel('Edit task', { exact: true }).click(); await page.locator('form input').first().fill('Edited stateful task');
    await page.locator('form select').nth(0).selectOption('completed');
    const update = await hold('**/api/tasks/*', 'PUT', { message: 'Injected update failure' });
    await visibleButton('Save changes').click(); await update.seen; assert.equal(await visibleButton('Saving...').isDisabled(), true); update.release();
    await page.getByRole('alert').filter({ hasText: 'Injected update failure' }).waitFor(); await update.clear();
    await visibleButton('Save changes').click(); await page.locator('form').waitFor({ state: 'hidden' }); await text('Edited stateful task');
    await verifyDashboard();
    page.once('dialog', dialog => dialog.dismiss()); await page.getByLabel('Delete task', { exact: true }).click(); await text('Edited stateful task');
    const deletion = await hold('**/api/tasks/*', 'DELETE', { message: 'Injected delete failure' });
    page.once('dialog', dialog => dialog.accept()); await page.getByLabel('Delete task', { exact: true }).click(); await deletion.seen; assert.equal(await visibleButton('Deleting task').isDisabled(), true); deletion.release();
    await text('Injected delete failure'); await deletion.clear();
    await page.reload(); await text('Edited stateful task');
    page.once('dialog', dialog => dialog.accept()); await page.getByLabel('Delete task', { exact: true }).click(); await text('No tasks found');
    await verifyDashboard();
    await page.goto(base+'/dashboard'); await text('No tasks yet. Create your first task to get started.');
    await page.goto(base+'/tasks'); await text('No tasks found');
    checks.push('details API/full description, refreshed persistence, dashboard counts after create/update and empty state after delete');
    checks.push('modal close, all task fields, create/update HTTP failure with preserved input and retry, delete dismiss/failure/retry');

    // Exercise Previous as well as Next, and verify disabled boundaries.
    await page.evaluate(async () => {
      for (let index = 0; index < 11; index++) {
        const response = await fetch('http://localhost:5055/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('taskflow_token')}` }, body: JSON.stringify({ title: `Pagination ${index}` }) });
        if (!response.ok) throw new Error('Pagination fixture creation failed');
      }
    });
    await page.reload(); await text('1 / 2'); assert.equal(await visibleButton('Previous').isDisabled(), true);
    await visibleButton('Next').click(); await text('2 / 2'); assert.equal(await visibleButton('Next').isDisabled(), true);
    await visibleButton('Previous').click(); await text('1 / 2');
    await visibleLink('Tasks').click(); await page.waitForURL('**/tasks');
    await visibleButton('Logout').click(); await page.waitForURL('**/login'); await login();
    await page.goto(base + '/does-not-exist'); await text('Page not found'); await visibleLink('Back to dashboard').click(); await page.waitForURL('**/dashboard');
    checks.push('Previous/Next boundaries, task self-navigation/logout, 404 recovery');

    await page.setViewportSize({ width: 390, height: 844 });
    await visibleLink('Tasks').click(); await page.waitForURL('**/tasks');
    await visibleLink('Dashboard').click(); await page.waitForURL('**/dashboard');
    await visibleButton('Logout').click(); await page.waitForURL('**/login'); await login();
    const expired = await hold('**/api/tasks?*', 'GET', { status: 401, message: 'Injected expired token' });
    await visibleLink('Tasks').click(); await expired.seen; expired.release(); await page.waitForURL('**/login'); await expired.clear();
    assert.equal(await page.evaluate(() => localStorage.getItem('taskflow_token')), null);
    checks.push('mobile dashboard/tasks navigation/logout; API 401 redirects and clears session');

    const unexpectedConsoleErrors = consoleErrors.filter(error => !error.message.startsWith('Failed to load resource:') || !expectedFailures.some(failure => failure.url === error.url));
    assert.equal(unexpectedConsoleErrors.length, 0, JSON.stringify(unexpectedConsoleErrors));
    assert.equal(runtimeErrors.length, 0, JSON.stringify(runtimeErrors));
    assert.equal(unexpectedFailures.length, 0, JSON.stringify(unexpectedFailures));
    console.log(JSON.stringify({ suite: 'production browser controls and failure states', checks, expectedInjectedFailures: expectedFailures, unexpectedFailures, unexpectedConsoleErrors, runtimeErrors, consoleErrorsFromInjectedFailures: consoleErrors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
