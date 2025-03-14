# member-tools

We have several spreadsheets (mostly lists of members) that the leaders of the ward are using for different purposes: keeping track of callings in progress, assigning people to FHE groups, marking people as active or less active (for ministering purposes), knowing members' interests/talents for potential future callings, etc.
 
Over time, because of all the people moving in and out of the ward, it has become difficult to keep all of those lists synchronized and updated, so we thought about creating a web app to replace all of them, likely using React and Node, and all the data will be stored in MongoDB (or maybe Supabase). The idea is to create different roles for the different types of callings, so when the leaders of the ward log in, they will be able to see and modify only the information relevant to them.

## ERD
![member-tools](https://github.com/user-attachments/assets/de345a13-1a72-424e-b069-129073fa4a95)

## System Design
<img width="939" alt="member-tools-system" src="https://github.com/user-attachments/assets/3cc80325-f551-4dc9-b447-6d7824c51cd7" />

## Initial Goals
* **3/19:**
  * Set up database
  * Figure out how to get list of members automatically (web scraping)
* **3/26:**
  * Start working on website
  * Figure out authorization and access based on roles/callings
* **4/2:**
  * Create different pahes for different callings
  * Start working on functions to read/write to database
* **4/9:**
  * Finalize front end
  * Finish functions to read/write to database
* **4/16:**
  * Complete final testing
  * Fix any remaining bugs/minor changes
