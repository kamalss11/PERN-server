//const mongoose = require('mongoose')
//
//const DB = process.env.DATABASE
//
//mongoose.connect(DB,{
//}).then(()=>{
//    console.log("Connection Successful")
//}).catch((err)=>{
//    console.log(err)
//})

const Pool = require('pg').Pool

const pool = new Pool({
    host: 'localhost',
    port: '4000',
    user: 'postgres',
    password: 'kamal',
    database: 'iqac'
})

const execute = async (query) => {
    try {
        await pool.connect();     // gets connection
        await pool.query(query);  // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

// const add = `ALTER TABLE users
// ADD COLUMN department VARCHAR(100) NOT NULL,
// ADD COLUMN roll VARCHAR(100) NOT NULL`;
// 
const user = `
    CREATE TABLE IF NOT EXISTS "users"(
	    "user_id" SERIAL,
	    "name" VARCHAR(100) NOT NULL,
	    "email" VARCHAR(15) NOT NULL,
        "password" VARCHAR(15) NOT NULL,
        "department" VARCHAR(100) NOT NULL,
        "roll" VARCHAR(100) NOT NULL,
	    PRIMARY KEY ("user_id")
    );`;

const research_projects = `
    CREATE TABLE IF NOT EXISTS "research_projects"(
	    "id" SERIAL,
        "user_id" int,
	    "title" VARCHAR(100),
        "no" VARCHAR(100),
        "amount_sanctioned" int,
	    "fileno" VARCHAR(15),
        "amount_received" int,
        "date_sanctioned" VARCHAR(100),
        "funding_agency" VARCHAR(15),
        "date" VARCHAR(100),
	    PRIMARY KEY ("id"),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );`;

const patents = `
CREATE TABLE IF NOT EXISTS "patents"(
    "id" SERIAL,
    "user_id" int,
    "title" VARCHAR(100),
    "field" VARCHAR(100),
    "fileno" VARCHAR(100),
    "date_awarded_patent" VARCHAR(100),
    "royalty_received" VARCHAR(100),
    "providing_agency" VARCHAR(100),
    "country" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const aw = `
CREATE TABLE IF NOT EXISTS "awards_for_innovation"(
    "id" SERIAL,
    "user_id" int,
    "awardee_name" VARCHAR(100),
    "designation" VARCHAR(100),
    "award_category" VARCHAR(100),
    "title" VARCHAR(100),
    "awarding_agency" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const degree = `
CREATE TABLE IF NOT EXISTS "degree"(
    "id" SERIAL,
    "user_id" int,
    "deg" VARCHAR(100),
    "guide_name" VARCHAR(100),"title" VARCHAR(100),
    "external" VARCHAR(100),
    "venue" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const fellowship = `
CREATE TABLE IF NOT EXISTS "fellowship"(
    "id" SERIAL,
    "user_id" int,
    "fellowship" VARCHAR(100),
    "date_sanctioned" VARCHAR(100),
    "funding_agency" VARCHAR(100),
    "sanctioned_amount" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const collab_activ = `
CREATE TABLE IF NOT EXISTS "collab_activ"(
    "id" SERIAL,
    "user_id" int,"activity" VARCHAR(100),
    "participant" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "period" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const linkages = `
CREATE TABLE IF NOT EXISTS "linkages"(
    "id" SERIAL,
    "user_id" int,
    "title" VARCHAR(100),
    "partnering_agency" VARCHAR(100),
    "period" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const mou = `
CREATE TABLE IF NOT EXISTS "mou"(
    "id" SERIAL,
    "user_id" int,
    "organization" VARCHAR(100),
    "date_signed" VARCHAR(100),
    "period" VARCHAR(100),
    "participants" VARCHAR(100),
    "purpose" VARCHAR(100),
    "total" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const conference = `
CREATE TABLE IF NOT EXISTS "conference"(
    "id" SERIAL,
    "user_id" int,
    "con_sem" VARCHAR(100),
    "title" VARCHAR(100),
    "sponsoring_agency" VARCHAR(100),
    "resource_person" VARCHAR(100),
    "venue" VARCHAR(100),
    "objective" VARCHAR(100),
    "outcome" VARCHAR(100),
    "level" VARCHAR(100),
    "total" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const guest_lectures = `
CREATE TABLE IF NOT EXISTS "guest_lectures"(
    "id" SERIAL,
    "user_id" int,
    "resource_person" VARCHAR(100),
    "designation" VARCHAR(100),
    "topic" VARCHAR(100),
    "venue" VARCHAR(100),
    "objective" VARCHAR(100),
    "outcome" VARCHAR(100),
    "total" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const extension_activities = `
CREATE TABLE IF NOT EXISTS "extension_activities"(
    "id" SERIAL,
    "user_id" int,
    "activities" VARCHAR(100),
    "collaborations" VARCHAR(100),
    "venue" VARCHAR(100),
    "total" VARCHAR(100),
    "date" VARCHAR(100),    
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const industrial_visits = `
CREATE TABLE IF NOT EXISTS "industrial_visits"(
    "id" SERIAL,
    "user_id" int,
    "classes" VARCHAR(100),
    "date" VARCHAR(100),
    "address" VARCHAR(100),
    "total" VARCHAR(100),
    "outcome" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const evs = `
CREATE TABLE IF NOT EXISTS "evs"(
    "id" SERIAL,
    "user_id" int,
    "date" VARCHAR(100),
    "place" VARCHAR(100),
    "total" VARCHAR(100),
    "activity" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const departmental_activities = `
CREATE TABLE IF NOT EXISTS "departmental_activities"(
    "id" SERIAL,
    "user_id" int,
    "activity" VARCHAR(100),
    "guest" VARCHAR(100),
    "topic" VARCHAR(100),
    "total" VARCHAR(100),
    "venue" VARCHAR(100),
    "filled" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const projects_services = `
CREATE TABLE IF NOT EXISTS "projects_services"(
    "id" SERIAL,
    "user_id" int,
    "title" VARCHAR(100),
    "no" VARCHAR(100),
    "revenue_generated" VARCHAR(100),
    "date_sanction" VARCHAR(100),
    "sponsor" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const honours = `
CREATE TABLE IF NOT EXISTS "honours"(
    "id" SERIAL,
    "user_id" int,
    "award_honour" VARCHAR(100),
    "details" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const exams = `
CREATE TABLE IF NOT EXISTS "exams"(
    "id" SERIAL,
    "user_id" int,
    "award_honour" VARCHAR(100),
    "details" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const books_published = `
CREATE TABLE IF NOT EXISTS "books_published"(
    "id" SERIAL,
    "user_id" int,
    "name" VARCHAR(100),
    "publisher" VARCHAR(100),
    "level" VARCHAR(100),
    "isbn_no" VARCHAR(100),
    "date" VARCHAR(100),    
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const chapters_contributed = `
CREATE TABLE IF NOT EXISTS "chapters_contributed"(
    "id" SERIAL,
    "user_id" int,
    "con" VARCHAR(100),
    "publication" VARCHAR(100),
    "level" VARCHAR(100),
    "isbn_no" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const conference_proceeding = `
CREATE TABLE IF NOT EXISTS "conference_proceeding"(
    "id" SERIAL,
    "user_id" int,
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const paper_presentation = `
CREATE TABLE IF NOT EXISTS "paper_presentation"(
    "id" SERIAL,
    "user_id" int,
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const journal_publications = `
CREATE TABLE IF NOT EXISTS "journal_publications"(
    "id" SERIAL,
    "user_id" int,
    "title" VARCHAR(100),
    "jou" VARCHAR(100),
    "issn_no" VARCHAR(100),
    "volume" VARCHAR(100),
    "sci" VARCHAR(100),
    "impact" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const fconference = `
CREATE TABLE IF NOT EXISTS "fconference"(
    "id" SERIAL,
    "user_id" int,
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "programme_outcome" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const resource_person = `
CREATE TABLE IF NOT EXISTS "resource_person"(
    "id" SERIAL,
    "user_id" int,
    "sem" VARCHAR(100),
    "topic" VARCHAR(100),
    "event" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "filled" VARCHAR(100),
    "date" VARCHAR(100),    
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const financial_support = `
CREATE TABLE IF NOT EXISTS "financial_support"(
    "id" SERIAL,
    "user_id" int,
    "f" VARCHAR(100),
    "amount_support" VARCHAR(100),
    "date" VARCHAR(100),        
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const development_programmes = `
CREATE TABLE IF NOT EXISTS "development_programmes"(
    "id" SERIAL,
    "user_id" int,
    "training" VARCHAR(100),
    "title" VARCHAR(100),
    "venue" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "level" VARCHAR(100),
    "date" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const online_courses = `
CREATE TABLE IF NOT EXISTS "online_courses"(
    "id" SERIAL,
    "user_id" int,
    "training" VARCHAR(100),
    "title" VARCHAR(100),
    "duration" VARCHAR(100),
    "date" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "level" VARCHAR(100),
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

const e_content = `
CREATE TABLE IF NOT EXISTS "e_content"(
    "id" SERIAL,
    "user_id" int,
    "module" VARCHAR(100),
    "platform" VARCHAR(100),
    "date" VARCHAR(100),    
    PRIMARY KEY ("id"),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);`;

// execute(user).then(result => {
//     if (result) {
//         console.log('Table created user');
//     }
// });

// execute(research_projects).then(result => {
//     if (result) {
//         console.log('Table created rp');
//     }
// });

// execute(patents).then(result => {
//     if (result) {
//         console.log('Table created patents');
//     }
// });

// execute(aw).then(result => {
//     if (result) {
//         console.log('Table created awards');
//     }
// });

// execute(degree).then(result => {
//     if (result) {
//         console.log('Table created degree');
//     }
// });

execute(fellowship).then(result => {
    if (result) {
        console.log('Table created fellowship');
    }
});

// execute(collab_activ).then(result => {
//     if (result) {
//         console.log('Table created collab_activ');
//     }
// });

// execute(linkages).then(result => {
//     if (result) {
//         console.log('Table created linkages');
//     }
// });

// execute(mou).then(result => {
//     if (result) {
//         console.log('Table created mou');
//     }
// });

// execute(conference).then(result => {
//     if (result) {
//         console.log('Table created conference');
//     }
// });

// execute(guest_lectures).then(result => {
//     if (result) {
//         console.log('Table created guest_lectures');
//     }
// });

// execute(extension_activities).then(result => {
//     if (result) {
//         console.log('Table created extension_activities');
//     }
// });

// execute(industrial_visits).then(result => {
//     if (result) {
//         console.log('Table created industrial_visits');
//     }
// });

// execute(evs).then(result => {
//     if (result) {
//         console.log('Table created evs');
//     }
// });

// execute(departmental_activities).then(result => {
//     if (result) {
//         console.log('Table created departmental_activities');
//     }
// });

// execute(projects_services).then(result => {
//     if (result) {
//         console.log('Table created projects_services');
//     }
// });

// execute(honours).then(result => {
//     if (result) {
//         console.log('Table created honours');
//     }
// });

// execute(exams).then(result => {
//     if (result) {
//         console.log('Table created exams');
//     }
// });

// execute(books_published).then(result => {
//     if (result) {
//         console.log('Table created books_published');
//     }
// });

// execute(chapters_contributed).then(result => {
//     if (result) {
//         console.log('Table created chapters_contributed');
//     }
// });

execute(conference_proceeding).then(result => {
    if (result) {
        console.log('Table created conference_proceeding');
    }
});

// execute(paper_presentation).then(result => {
//     if (result) {
//         console.log('Table created paper_presentation');
//     }
// });

// execute(journal_publications).then(result => {
//     if (result) {
//         console.log('Table created journal_publications');
//     }
// });

// execute(fconference).then(result => {
//     if (result) {
//         console.log('Table created fconference');
//     }
// });

// execute(resource_person).then(result => {
//     if (result) {
//         console.log('Table created resource_person');
//     }
// });

// execute(financial_support).then(result => {
//     if (result) {
//         console.log('Table created financial_support');
//     }
// });

// execute(development_programmes).then(result => {
//     if (result) {
//         console.log('Table created development_programmes');
//     }
// });

// execute(online_courses).then(result => {
//     if (result) {
//         console.log('Table created online_courses');
//     }
// });

// execute(e_content).then(result => {
//     if (result) {
//         console.log('Table created e_content');
//     }
// });

module.exports = pool