import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const trip={scheduleId:1,routeId:1,source:'Colombo',destination:'Kandy',busId:1,travelDate:'2027-01-20',departureTime:'08:00:00',price:1500,totalSeats:12,availableSeats:11};
test.beforeEach(async({page})=>{
 await page.route('**/seat-booking-application/api/**',route=>{
 const path=new URL(route.request().url()).pathname;
 const data=path.endsWith('/routes')?[{routeId:1,source:'Colombo',destination:'Kandy'}]:path.includes('/schedules/')?[trip]:path.includes('/seats/')?Array.from({length:12},(_,i)=>({seatId:i+1,busId:1,seatNumber:String(i+1),booked:i===11})):[];
 return route.fulfill({json:{status:'SUCCESS',returnCode:'00',description:'Test fixture',data}});
 });
});
for(const width of [320,375,768,1024,1440,2560]) test(`home fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.getByRole('heading',{name:/The journey/})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Switch to dark theme'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('seat selection, keyboard navigation, anonymous auth gate',async({page})=>{
 await page.goto('/book/1');const seat=page.getByRole('button',{name:'Seat 1, available',exact:true});await seat.click();await expect(page.getByRole('button',{name:'Seat 1, selected'})).toHaveAttribute('aria-pressed','true');
 await seat.press('ArrowRight');expect(await page.evaluate(()=>document.activeElement?.id)).not.toBe('seat-1');
 await expect(page.getByRole('button',{name:'Seat 12, occupied'})).toBeDisabled();
 await page.getByRole('button',{name:/Continue/i}).first().click();await expect(page.getByRole('heading',{name:'Sign in to book your seat'})).toBeVisible();
});
test('public pages render and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});for(const path of ['/routes','/schedules','/about','/contact','/login','/passengers/register']){await page.goto(path);await expect(page.locator('h1').first()).toBeVisible();}
});
test('home accessibility audit',async({page})=>{
 await page.goto('/');await expect(page.locator('h1')).toBeVisible();const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();expect(report.violations).toEqual([]);
});
