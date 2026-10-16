import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';
import TasksPage from '../pages/TasksPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
const token = () => `header.${btoa(JSON.stringify({exp:Date.now()/1000+3600}))}.signature`;
const Session = () => { const auth=useAuth(); return <><span>{auth.isAuthenticated?'signed in':'signed out'}</span><button onClick={auth.logout}>End session</button></>; };
const mount = node => render(<MemoryRouter><AuthProvider>{node}</AuthProvider></MemoryRouter>);
beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('clears session on unauthorized responses', async()=>{
 localStorage.setItem('taskflow_token',token());localStorage.setItem('taskflow_user',JSON.stringify({name:'Tester'}));mount(<Session/>);
 expect(screen.getByText('signed in')).toBeInTheDocument();
 const reject=api.interceptors.response.handlers[0].rejected;
 await act(async()=>{await reject({response:{status:401}}).catch(()=>{});});
 expect(screen.getByText('signed out')).toBeInTheDocument();expect(localStorage.getItem('taskflow_token')).toBeNull();
});
it('recovers from corrupt storage and expires a signed-in session',async()=>{
 localStorage.setItem('taskflow_user','broken');localStorage.setItem('taskflow_token',token());mount(<Session/>);
 await waitFor(()=>expect(screen.getByText('signed out')).toBeInTheDocument());
});
it('rejects an expired stored token',async()=>{
 localStorage.setItem('taskflow_token',`h.${btoa(JSON.stringify({exp:1}))}.s`);mount(<Session/>);
 await waitFor(()=>expect(screen.getByText('signed out')).toBeInTheDocument());
});
it('logs out and removes persisted credentials',()=>{
 localStorage.setItem('taskflow_token',token());localStorage.setItem('taskflow_user','{}');mount(<Session/>);
 fireEvent.click(screen.getByText('End session'));expect(screen.getByText('signed out')).toBeInTheDocument();expect(localStorage.length).toBe(0);
});
it('shows task loading, empty and error states',async()=>{
 let resolve;vi.spyOn(api,'get').mockReturnValue(new Promise(r=>{resolve=r;}));mount(<TasksPage/>);
 expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
 await act(async()=>resolve({data:{data:[],pagination:{totalPages:1,totalTasks:0,page:1,limit:10}}}));
 expect(screen.getByText('No tasks found')).toBeInTheDocument();
 vi.mocked(api.get).mockRejectedValue(new Error('offline'));
 fireEvent.change(screen.getByPlaceholderText('Search tasks'),{target:{value:'x'}});
 await screen.findByText('Unable to load tasks. Please try again.');
});
it('displays dashboard request failures without false empty data',async()=>{
 vi.spyOn(api,'get').mockRejectedValue(new Error('offline'));mount(<DashboardPage/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load dashboard');
 expect(screen.queryByText('No tasks yet. Create your first task to get started.')).not.toBeInTheDocument();
});
it('cancel edit resets the create form and clearing due date sends null',async()=>{
 const task={_id:'abc',title:'Existing',status:'pending',priority:'medium',dueDate:'2026-10-20',createdAt:'2026-10-01'};
 vi.spyOn(api,'get').mockResolvedValue({data:{data:[task],pagination:{page:1,totalPages:1,totalTasks:1}}});vi.spyOn(api,'put').mockResolvedValue({});
 const {container}=mount(<TasksPage/>);await screen.findByText('Existing');
 fireEvent.click(screen.getByLabelText('Edit task'));fireEvent.change(container.querySelector('input[type="date"]'),{target:{value:''}});
 fireEvent.click(screen.getByText('Save changes'));await waitFor(()=>expect(api.put).toHaveBeenCalledWith('/tasks/abc',expect.objectContaining({dueDate:null})));
 await waitFor(()=>expect(screen.queryByText('Save changes')).not.toBeInTheDocument());
 fireEvent.click(screen.getByLabelText('Edit task'));fireEvent.click(screen.getByText('Cancel'));fireEvent.click(screen.getByRole('button',{name:'Create task'}));
 expect(screen.queryByText('Save changes')).not.toBeInTheDocument();expect(container.querySelector('form input').value).toBe('');
});
it('automatically ends a session when its JWT expiration time arrives',async()=>{
 vi.useFakeTimers();
 try {
  localStorage.setItem('taskflow_token',`h.${btoa(JSON.stringify({exp:Date.now()/1000+1}))}.s`);localStorage.setItem('taskflow_user','{}');mount(<Session/>);
  expect(screen.getByText('signed in')).toBeInTheDocument();
  await act(async()=>vi.advanceTimersByTime(1001));
  expect(screen.getByText('signed out')).toBeInTheDocument();
 } finally {vi.useRealTimers();}
});
it('keeps the newest search response when earlier requests finish late',async()=>{
 let finishOld;
 vi.spyOn(api,'get').mockImplementation((_url,config)=>config.params.search==='new'
  ? Promise.resolve({data:{data:[{_id:'new',title:'Newest response',createdAt:'2026-01-01'}],pagination:{page:1,totalPages:1,totalTasks:1}}})
  : new Promise(resolve=>{finishOld=resolve;}));
 mount(<TasksPage/>);
 fireEvent.change(screen.getByPlaceholderText('Search tasks'),{target:{value:'new'}});
 await screen.findByText('Newest response');
 await act(async()=>finishOld({data:{data:[],pagination:{page:1,totalPages:1,totalTasks:0}}}));
 expect(screen.getByText('Newest response')).toBeInTheDocument();
});
it('shows save errors inside the open task form',async()=>{
 vi.spyOn(api,'get').mockResolvedValue({data:{data:[],pagination:{page:1,totalPages:1,totalTasks:0}}});
 vi.spyOn(api,'post').mockRejectedValue({response:{data:{message:'Validation failed'}}});
 const {container}=mount(<TasksPage/>);await screen.findByText('No tasks found');
 fireEvent.click(screen.getByRole('button',{name:'Create task'}));
 fireEvent.change(container.querySelector('form input'),{target:{value:'Invalid'}});
 fireEvent.submit(container.querySelector('form'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed');
 expect(container.querySelector('form')).toContainElement(screen.getByRole('alert'));
});
it('prevents duplicate task submissions while saving and exposes the pending state',async()=>{
 vi.spyOn(api,'get').mockResolvedValue({data:{data:[],pagination:{page:1,totalPages:1,totalTasks:0}}});
 let finish;
 vi.spyOn(api,'post').mockReturnValue(new Promise(resolve=>{finish=resolve;}));
 const {container}=mount(<TasksPage/>);await screen.findByText('No tasks found');
 fireEvent.click(screen.getByRole('button',{name:'Create task'}));
 fireEvent.change(container.querySelector('form input'),{target:{value:'Only once'}});
 fireEvent.submit(container.querySelector('form'));
 fireEvent.submit(container.querySelector('form'));
 expect(api.post).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('button',{name:'Saving...'})).toBeDisabled();
 expect(screen.getByRole('button',{name:'Cancel'})).toBeDisabled();
 await act(async()=>finish({data:{}}));
 await waitFor(()=>expect(container.querySelector('form')).toBeNull());
});
it('prevents duplicate deletion while the request is pending',async()=>{
 const task={_id:'pending-delete',title:'Delete once',createdAt:'2026-01-01'};
 vi.spyOn(api,'get').mockResolvedValue({data:{data:[task],pagination:{page:1,totalPages:1,totalTasks:1}}});
 vi.spyOn(window,'confirm').mockReturnValue(true);
 let finish;
 vi.spyOn(api,'delete').mockReturnValue(new Promise(resolve=>{finish=resolve;}));
 mount(<TasksPage/>);await screen.findByText('Delete once');
 const button=screen.getByRole('button',{name:'Delete task'});
 fireEvent.click(button);fireEvent.click(button);
 expect(api.delete).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('button',{name:'Deleting task'})).toBeDisabled();
 await act(async()=>finish({data:{}}));
});

it('loads complete task details from the API and shows detail failures',async()=>{
 const task={_id:'details',title:'Detail title',description:'Full description',status:'pending',priority:'high',createdAt:'2026-01-01'};
 vi.spyOn(api,'get').mockImplementation(url=>Promise.resolve(url==='/tasks/details'?{data:{data:task}}:{data:{data:[{...task,description:'Short list preview'}],pagination:{page:1,totalPages:1,totalTasks:1}}}));
 mount(<TasksPage/>);await screen.findByText('Detail title');
 fireEvent.click(screen.getByLabelText('View task details'));
 expect(await screen.findByText('Full description')).toBeInTheDocument();
 expect(api.get).toHaveBeenCalledWith('/tasks/details');
 fireEvent.click(screen.getByRole('button',{name:'Close details'}));
 vi.mocked(api.get).mockRejectedValue({response:{data:{message:'Task no longer available'}}});
 fireEvent.click(screen.getByLabelText('View task details'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Task no longer available');
});

it('loads and saves profile details, persists session identity and recovers from save failures',async()=>{
 const {default:ProfilePage}=await import('../pages/ProfilePage.jsx');
 const profile={name:'Original User',email:'profile@example.com',phone:'',location:'',jobTitle:'',bio:''};
 localStorage.setItem('taskflow_user',JSON.stringify(profile));localStorage.setItem('taskflow_token',token());
 vi.spyOn(api,'get').mockResolvedValue({data:{data:profile}});
 vi.spyOn(api,'put').mockRejectedValueOnce({response:{data:{message:'Email already registered'}}}).mockResolvedValueOnce({data:{data:{...profile,name:'Updated User',bio:'My profile'}}});
 mount(<ProfilePage/>);
 await screen.findByDisplayValue('Original User');
 fireEvent.change(screen.getByLabelText('Full name'),{target:{value:'Updated User'}});
 fireEvent.change(screen.getByLabelText('About you'),{target:{value:'My profile'}});
 fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
 expect(JSON.parse(localStorage.getItem('taskflow_user')).name).toBe('Original User');
 fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 expect(await screen.findByRole('status')).toHaveTextContent('Your profile has been updated.');
 expect(api.put).toHaveBeenLastCalledWith('/auth/me',expect.objectContaining({name:'Updated User',bio:'My profile'}));
 expect(JSON.parse(localStorage.getItem('taskflow_user')).name).toBe('Updated User');
});
