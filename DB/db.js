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
    port: '5432',
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
        console.error(error.stack+'28');
        return false;
    }
};

// const add = `ALTER TABLE users
// ADD COLUMN department VARCHAR(100) NOT NULL,
// ADD COLUMN roll VARCHAR(100) NOT NULL`;
// const alter = `alter table users alter column admission DATE;`

const user = `
    CREATE TABLE IF NOT EXISTS "users"(
	    "user_id" SERIAL,
	    "name" VARCHAR(100) NOT NULL,
	    "email" VARCHAR(100) NOT NULL,
        "password" VARCHAR(100) NOT NULL,
        "roll" VARCHAR(100),
        "department" VARCHAR(100) NOT NULL,
	    PRIMARY KEY ("user_id")
    );`;    

const reset_password = `
    CREATE TABLE IF NOT EXISTS "reset_password"(
	    "email" VARCHAR(25) NOT NULL,
        "createdat" VARCHAR(100) NOT NULL,
        "expiresat" VARCHAR(100) NOT NULL,
        "token" VARCHAR(100) NOT NULL
    );`;  

const research_projects = `
    CREATE TABLE IF NOT EXISTS "research_projects"(
	    "id" SERIAL,
        "n" VARCHAR(100),
	    "title" VARCHAR(100),
        "no" VARCHAR(100),
        "amount_sanctioned" decimal(10,5),
	    "fileno" VARCHAR(15),
        "amount_received" decimal(10,5),
        "date_sanctioned" VARCHAR(100),
        "funding_agency" VARCHAR(100),
        "date" DATE,
        "file" VARCHAR(100),
        "department" VARCHAR(100),
	    PRIMARY KEY ("id")
    );`;

const patents = `
CREATE TABLE IF NOT EXISTS "patents"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "title" VARCHAR(100),
    "field" VARCHAR(100),
    "fileno" VARCHAR(100),
    "date_awarded_patent" VARCHAR(100),
    "royalty_received" decimal(10,5),
    "providing_agency" VARCHAR(100),
    "country" VARCHAR(100),
    "date" DATE,
    "department" VARCHAR(100),
    PRIMARY KEY ("id")
);`;

const aw = `
CREATE TABLE IF NOT EXISTS "awards_for_innovation"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "awardee_name" VARCHAR(100),
    "designation" VARCHAR(100),
    "award_category" VARCHAR(100),
    "title" VARCHAR(100),
    "awarding_agency" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const degree = `
CREATE TABLE IF NOT EXISTS "degree"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "deg" VARCHAR(100),
    "guide_name" VARCHAR(100),
    "title" VARCHAR(100),
    "external" VARCHAR(100),
    "venue" VARCHAR(100),
    "date" DATE,
    "department" VARCHAR(100),
    PRIMARY KEY ("id")
);`;

const fellowship = `
CREATE TABLE IF NOT EXISTS "fellowship"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "fellowship" VARCHAR(100),
    "date_sanctioned" VARCHAR(100),
    "funding_agency" VARCHAR(100),
    "sanctioned_amount" decimal(10,5),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const collab_activ = `
CREATE TABLE IF NOT EXISTS "collab_activ"(
    "id" SERIAL,
    "activity" VARCHAR(100),
    "n" VARCHAR(100),
    "pasrticipant" VARCHAR(100),
    "financial_support" VARCHAR(100),
    "period" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const linkages = `
CREATE TABLE IF NOT EXISTS "linkages"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "title" VARCHAR(100),
    "partnering_agency" VARCHAR(100),
    "period" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const mou = `
CREATE TABLE IF NOT EXISTS "mou"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "organization" VARCHAR(100),
    "date_signed" VARCHAR(100),
    "period" VARCHAR(100),
    "participants" VARCHAR(100),
    "purpose" VARCHAR(100),
    "total" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const conference = `
CREATE TABLE IF NOT EXISTS "conference"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "con_sem" VARCHAR(100),
    "title" VARCHAR(100),
    "sponsoring_agency" VARCHAR(100),
    "resource_person" VARCHAR(100),
    "venue" VARCHAR(100),
    "objective" VARCHAR(100),
    "outcome" VARCHAR(100),
    "level" VARCHAR(100),
    "total" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const guest_lectures = `
CREATE TABLE IF NOT EXISTS "guest_lectures"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "resource_person" VARCHAR(100),
    "designation" VARCHAR(100),
    "topic" VARCHAR(100),
    "venue" VARCHAR(100),
    "objective" VARCHAR(100),
    "outcome" VARCHAR(100),
    "total" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const extension_activities = `
CREATE TABLE IF NOT EXISTS "extension_activities"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "activities" VARCHAR(100),
    "collaborations" VARCHAR(100),
    "venue" VARCHAR(100),
    "total" VARCHAR(100),
    "date" DATE,    
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const industrial_visits = `
CREATE TABLE IF NOT EXISTS "industrial_visits"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "classes" VARCHAR(100),
    "date" DATE,
    "address" VARCHAR(100),
    "total" VARCHAR(100),
    "outcome" VARCHAR(100),
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const evs = `
CREATE TABLE IF NOT EXISTS "evs"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "date" DATE,
    "place" VARCHAR(100),
    "total" VARCHAR(100),
    "activity" VARCHAR(100),
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const departmental_activities = `
CREATE TABLE IF NOT EXISTS "departmental_activities"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "activity" VARCHAR(100),
    "guest" VARCHAR(100),
    "topic" VARCHAR(100),
    "total" VARCHAR(100),
    "venue" VARCHAR(100),
    "filled" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const projects_services = `
CREATE TABLE IF NOT EXISTS "projects_services"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "title" VARCHAR(100),
    "no" VARCHAR(100),
    "revenue_generated" VARCHAR(100),
    "date_sanction" VARCHAR(100),
    "sponsor" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const honours = `
CREATE TABLE IF NOT EXISTS "honours"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "award_honour" VARCHAR(100),
    "details" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const exams = `
CREATE TABLE IF NOT EXISTS "exams"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "award_honour" VARCHAR(100),
    "details" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const books_published = `
CREATE TABLE IF NOT EXISTS "books_published"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "name" VARCHAR(100),
    "publisher" VARCHAR(100),
    "level" VARCHAR(100),
    "isbn_no" VARCHAR(100),
    "date" DATE,    
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const chapters_contributed = `
CREATE TABLE IF NOT EXISTS "chapters_contributed"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "con" VARCHAR(100),
    "publication" VARCHAR(100),
    "level" VARCHAR(100),
    "isbn_no" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const conference_proceeding = `
CREATE TABLE IF NOT EXISTS "conference_proceeding"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "financial_support" decimal(10,5),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const paper_presentation = `
CREATE TABLE IF NOT EXISTS "paper_presentation"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "financial_support" decimal(10,5),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const journal_publications = `
CREATE TABLE IF NOT EXISTS "journal_publications"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "title" VARCHAR(100),
    "jou" VARCHAR(100),
    "issn_no" VARCHAR(100),
    "volume" VARCHAR(100),
    "sci" VARCHAR(100),
    "impact" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const fconference = `
CREATE TABLE IF NOT EXISTS "fconference"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "financial_support" decimal(10,5),
    "programme_outcome" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const resource_person = `
CREATE TABLE IF NOT EXISTS "resource_person"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "sem" VARCHAR(100),
    "topic" VARCHAR(100),
    "event" VARCHAR(100),
    "venue" VARCHAR(100),
    "level" VARCHAR(100),
    "date" DATE,    
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const financial_support = `
CREATE TABLE IF NOT EXISTS "financial_support"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "f" VARCHAR(100),
    "amount_support" decimal(10,5),
    "date" DATE,        
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const development_programmes = `
CREATE TABLE IF NOT EXISTS "development_programmes"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "training" VARCHAR(100),
    "title" VARCHAR(100),
    "venue" VARCHAR(100),
    "financial_support" decimal(10,5),
    "level" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const online_courses = `
CREATE TABLE IF NOT EXISTS "online_courses"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "training" VARCHAR(100),
    "title" VARCHAR(100),
    "duration" VARCHAR(100),
    "date" DATE,
    "financial_support" decimal(10,5),
    "level" VARCHAR(100),
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const e_content = `
CREATE TABLE IF NOT EXISTS "e_content"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "module" VARCHAR(100),
    "platform" VARCHAR(100),
    "date" DATE,    
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const placements = `
CREATE TABLE IF NOT EXISTS "placements"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "company_placed" VARCHAR(100),
    "annual_package" decimal(10,5),
    "date" DATE,    
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_publications = `
CREATE TABLE IF NOT EXISTS "s_publications"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "title" VARCHAR(100),
    "n_journal" VARCHAR(100),
    "issn" VARCHAR(100),
    "volume" VARCHAR(100),
    "sci" VARCHAR(100),
    "impact" VARCHAR(100),
    "level" VARCHAR(100),  
    "date" DATE,  
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_paper_presentation = `
CREATE TABLE IF NOT EXISTS "s_paper_presentation"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "con" VARCHAR(100),
    "title" VARCHAR(100),
    "financial_support" decimal(10,5),
    "date" DATE,    
    "venue" VARCHAR(100),  
    "level" VARCHAR(100),  
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_conference = `
CREATE TABLE IF NOT EXISTS "s_conference"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "con" VARCHAR(100),
    "n_con" VARCHAR(100),
    "sponsoring_agency" VARCHAR(100),
    "poster" VARCHAR(100),
    "award" VARCHAR(100),
    "date" DATE,    
    "venue" VARCHAR(100),  
    "level" VARCHAR(100),  
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_competition = `
CREATE TABLE IF NOT EXISTS "s_competition"(
    "id" SERIAL,
    "n_event" VARCHAR(100),
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "con" VARCHAR(100),
    "n_con" VARCHAR(100),
    "award" VARCHAR(100),
    "sponsoring_agency" VARCHAR(100),
    "date" DATE,    
    "venue" VARCHAR(100),  
    "level" VARCHAR(100),  
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_training = `
CREATE TABLE IF NOT EXISTS "s_training"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "training" VARCHAR(100),
    "company" VARCHAR(100),
    "period" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_projectwork = `
CREATE TABLE IF NOT EXISTS "s_projectwork"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "guide" VARCHAR(100),
    "company" VARCHAR(100),
    "certificate" VARCHAR(100),
    "period" VARCHAR(100),
    "date" DATE,
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_exams = `
CREATE TABLE IF NOT EXISTS "s_exams"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "exam_qualified" VARCHAR(100),
    "e_roll" VARCHAR(100),
    "date" DATE, 
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_onlinecourses = `
CREATE TABLE IF NOT EXISTS "s_onlinecourses"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "portal" VARCHAR(100),
    "n_course" VARCHAR(100),
    "duration" VARCHAR(100),
    "financial_support" decimal(10,5),
    "date" DATE,
    "level" VARCHAR(100), 
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

const s_achievements = `
CREATE TABLE IF NOT EXISTS "s_achievements"(
    "id" SERIAL,
    "n" VARCHAR(100),
    "roll_no" VARCHAR(100),
    "prize" VARCHAR(100),
    "event" VARCHAR(100),
    "date" DATE,
    "venue" VARCHAR(100),
    "level" VARCHAR(100), 
    PRIMARY KEY ("id"),
    "department" VARCHAR(100)
);`;

execute(user).then(result => {
    if (result) {
        console.log('Table created user');
    }
});

// execute(research_projects).then(result => {
//     if (result) {
//         console.log('Table created rp');
//     }
// });

// execute(reset_password).then(result => {
//     if (result) {
//         console.log('Table created rp');
//     }
// });

// execute(alter).then(result => {
//     if (result) {
//         console.log('Table altered rp');
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

// execute(fellowship).then(result => {
//     if (result) {
//         console.log('Table created fellowship');
//     }
// });

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

// execute(conference_proceeding).then(result => {
//     if (result) {
//         console.log('Table created conference_proceeding');
//     }
// });

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

// execute(placements).then(result => {
//     if (result) {
//         console.log('Table created placements');
//     }
// });

// execute(s_publications).then(result => {
//     if (result) {
//         console.log('Table created s_publications');
//     }
// });

// execute(s_conference).then(result => {
//     if (result) {
//         console.log('Table created s_conference');
//     }
// });

// execute(s_competition).then(result => {
//     if (result) {
//         console.log('Table created s_competition');
//     }
// });

// execute(s_paper_presentation).then(result => {
//     if (result) {
//         console.log('Table created s_paper_presentation');
//     }
// });

// execute(s_training).then(result => {
//     if (result) {
//         console.log('Table created s_training');
//     }
// });

execute(s_projectwork).then(result => {
    if (result) {
        console.log('Table created s_projectwork');
    }
});

execute(s_exams).then(result => {
    if (result) {
        console.log('Table created s_exams');
    }
});

execute(s_onlinecourses).then(result => {
    if (result) {
        console.log('Table created s_onlinecourses');
    }
});

execute(s_achievements).then(result => {
    if (result) {
        console.log('Table created s_achievements');
    }
});

module.exports = pool