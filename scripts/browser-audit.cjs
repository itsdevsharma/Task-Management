// Set PLAYWRIGHT_MODULE to an installed Playwright package path when outside this repo.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/snap/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 const errors=[], failures=[], expected=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error') errors.push({text:m.text(),location:m.location()});});
 page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
 page.on('response',r=>{if(r.status()>=400) expected.push({url:r.url(),status:r.status()});});
 const base=process.env.AUDIT_URL || 'http://127.0.0.1:5174';
 await page.goto(base+'/register');
 await page.locator('input[name=name]').fill('Browser Auditor');
 const email=`audit-${Date.now()}@example.com`;
 await page.locator('input[name=email]').fill(email);
 await page.locator('input[name=password]').fill('AuditPassword123!');
 await page.locator('input[name=confirmPassword]').fill('AuditPassword123!');
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.waitForURL('**/dashboard');
 await page.getByText('No tasks yet. Create your first task to get started.').waitFor();
 await page.getByRole('link',{name:'New task'}).click();
 await page.locator('form').waitFor();
 await page.locator('form input').first().fill('Browser task');
 await page.locator('form input[type=date]').fill('2026-10-20');
 await page.locator('form').getByRole('button',{name:'Create task',exact:true}).click();
 await page.getByText('Browser task',{exact:true}).waitFor();
 await page.getByLabel('Edit task',{exact:true}).click();
 await page.locator('form input[type=date]').fill('');
 await page.getByRole('button',{name:'Save changes'}).click();
 await page.locator('form').waitFor({state:'hidden'});
 assert.equal(await page.locator('tbody tr td').nth(3).innerText(),'—');
 await page.getByLabel('Edit task',{exact:true}).click();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Create task',exact:true}).click();
 assert.equal(await page.locator('form input').first().inputValue(),'');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByPlaceholder('Search tasks').fill('missing');
 await page.getByText('No tasks found',{exact:true}).waitFor();
 await page.getByPlaceholder('Search tasks').fill('Browser');
 await page.getByText('Browser task',{exact:true}).waitFor();
 page.once('dialog',d=>d.accept());
 await page.getByLabel('Delete task',{exact:true}).click();
 await page.getByText('No tasks found',{exact:true}).waitFor();
 // Populate enough records to exercise the actual pagination buttons.
 await page.evaluate(async()=>{
   const token=localStorage.getItem('taskflow_token');
   for(let i=0;i<11;i++) {
     const r=await fetch('http://localhost:5055/api/tasks',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({title:`Page item ${i}`,status:i===0?'completed':'pending',priority:i===0?'high':'low',dueDate:`2026-11-${String(i+1).padStart(2,'0')}`})});
     if(!r.ok) throw new Error(`Fixture request failed ${r.status}`);
   }
 });
 await page.getByPlaceholder('Search tasks').fill('');
 await page.getByText('11 tasks',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await page.getByText('2 / 2',{exact:true}).waitFor();
 page.once('dialog',d=>d.accept());await page.getByLabel('Delete task',{exact:true}).click();
 await page.getByText('1 / 1',{exact:true}).waitFor();
 await page.locator('select').nth(0).selectOption('completed');
 await page.getByText('No tasks found',{exact:true}).waitFor(); // oldest item was removed from page two
 await page.locator('select').nth(0).selectOption('pending');
 await page.getByText('10 tasks',{exact:true}).waitFor();
 await page.locator('select').nth(1).selectOption('low');
 await page.locator('select').nth(2).selectOption('dueDate');
 await page.getByText('Page item 10',{exact:true}).waitFor();
 await page.waitForTimeout(100);
 assert.equal(await page.locator('tbody tr').first().locator('td').first().innerText().then(t=>t.split('\n')[0]),'Page item 10');
 await page.getByRole('link',{name:'Dashboard',exact:true}).first().click();
 await page.getByText('Recent tasks',{exact:true}).waitFor();
 await page.getByRole('link',{name:'View all',exact:false}).click();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Logout',exact:true}).filter({visible:true}).click();
 await page.waitForURL('**/login');
 assert.equal(await page.evaluate(()=>localStorage.getItem('taskflow_token')),null);
 await page.goto(base+'/dashboard');await page.waitForURL('**/login');
 await page.getByPlaceholder('you@example.com').fill(email);
 await page.getByPlaceholder('Enter your password').fill('AuditPassword123!');
 await page.getByRole('button',{name:'Show password'}).click();
 assert.equal(await page.getByPlaceholder('Enter your password').getAttribute('type'),'text');
 await page.getByRole('button',{name:'Hide password'}).click();
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard');

 console.log(JSON.stringify({passed:['browser registration + automatic login','dashboard empty state','New task link opens form','create task','edit clears due date','cancel edit resets create form','search/empty state','delete with confirmation','mobile logout','protected redirect','pagination and deleting final page','status and priority filters','due-date sorting','dashboard navigation','login form and password visibility'],consoleErrors:errors,failedRequests:failures,httpErrors:expected},null,2));
 await browser.close();
 assert.equal(errors.length,0);assert.equal(failures.length,0);assert.equal(expected.length,0);
})().catch(e=>{console.error(e);process.exit(1)});
