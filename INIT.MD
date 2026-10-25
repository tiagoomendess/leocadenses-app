# Leocadenses Web App

A port of the old leocadenses website built on Laravel for the modern times. The website is supposed to be simple and functional website for a small amateur football club. The old website is already out of air and will not be anymore because of PHP vulnerabilities, that's why this is being done.

## Objective

The objective of this project is to replicate the old website for the GDR Leocadenses, by keeping the exact same data model, but modernizing the UI facing the end user. Backoffice can be as bare bones as possible, liek the old one.

The old one also used Voyager, a CMS like platform that made possible to manage the site's entities. Don't install any other similar package for javascript, build everything in svelte and using a component library.

- Use flowbite-svelte for UI
  - customize the colors to match the club colors
- Site should use now Clourflare R2 for storage instead of in server storage
- it will run using nodejs inside a VPS behind cloudflare
  - So build also an nginx config that I can then paste in the server
  - choose a port 3005 for exposing the web app
- Users need to be able to login with the exact same credentials as before
- New front site should assume a more modern design, with a bottom dock to navigate the app.
- Back button on the top left when needed
- You can improve UX but the same set of functionalities should be available
- The same URL/URI paths should be available on the new site for backwards compatibility
- Default language is portuguese from Portugal.
- It should include dark and light modes
- I want to be able to do migrations in the future, so define the best strategy for this
- When in doubt take inspiration on domingoasdez-app migration, which was also a port from Laravel -> svelte, but keep in mind leocadenses website is going to keep the frontend and backoffice in the same project.
