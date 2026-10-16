const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/snap/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();page.setDefaultTimeout(10000);
 const base=process.env.AUDIT_URL || 'http://127.0.0.1:5174';
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const visibleLink=name=>page.getByRole('link',{name,exact:true}).filter({visible:true}).first();
 const visibleButton=name=>page.getByRole('button',{name,exact:true}).filter({visible:true});
 mkdirSync('audit-results/profile-mobile',{recursive:true});
 try {
  await page.goto(base+'/register');
  await page.locator('[name=name]').fill('Profile Tester');await page.locator('[name=email]').fill(`profile-${Date.now()}@example.com`);
  await page.locator('[name=password]').fill('ProfilePassword123!');await page.locator('[name=confirmPassword]').fill('ProfilePassword123!');
  await visibleButton('Create account').click();await page.waitForURL('**/dashboard');
  await visibleLink('Profile').click();await page.waitForURL('**/profile');await page.getByLabel('Full name',{exact:true}).fill('Mobile Profile');
  await page.getByLabel('Phone number').fill('+91 98765 43210');await page.getByLabel('Location',{exact:true}).fill('Mumbai, India');
  await page.getByLabel('Job title').fill('MERN Developer');await page.getByLabel('About you').fill('I enjoy building useful applications.');
  await visibleButton('Save changes').click();await page.getByRole('status').filter({hasText:'Your profile has been updated.'}).waitFor();
  await page.reload();await page.getByLabel('Full name',{exact:true}).waitFor();assert.equal(await page.getByLabel('Full name',{exact:true}).inputValue(),'Mobile Profile');
  assert.equal(await page.getByLabel('About you').inputValue(),'I enjoy building useful applications.');
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:844});
   for(const route of ['Profile','Dashboard','Tasks']){
    await visibleLink(route).click();await page.waitForURL(`**/${route.toLowerCase()}`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route} overflows at ${width}`);
   }
  }
  await page.setViewportSize({width:390,height:844});
  await visibleButton('Create task').click();await page.locator('form input').first().fill('A clear mobile task');
  await page.locator('form textarea').fill('A complete description with enough detail to verify the redesigned panel.');
  await page.locator('form select').nth(1).selectOption('high');
  await page.locator('form button[type=submit]').click();await page.getByText('A clear mobile task',{exact:true}).waitFor();
  assert.equal(await page.locator('tbody tr').first().evaluate(e=>getComputedStyle(e).display),'grid');
  await page.getByLabel('View task details').click();const dialog=page.getByRole('dialog',{name:'Task details'});
  await dialog.getByText('A clear mobile task',{exact:true}).waitFor();await dialog.getByText('High priority',{exact:true}).waitFor();
  assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);
  await page.screenshot({path:'audit-results/profile-mobile/task-details-mobile.png',fullPage:true});
  await dialog.getByRole('button',{name:'Edit task',exact:true}).click();await page.getByRole('dialog',{name:'Edit task'}).waitFor();
  assert.equal(await page.locator('form input').first().inputValue(),'A clear mobile task');
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await visibleLink('Profile').click();await page.getByLabel('Phone number').waitFor();
  await page.screenshot({path:'audit-results/profile-mobile/profile-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'audit-results/profile-mobile/profile-desktop.png',fullPage:true});
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('PASS: profile save/reload, session name update, responsive navigation at 320/390/768/1280px, no page overflow, mobile task cards/details/edit/Escape.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
