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
	    "id" SERIAL,
	    "name" VARCHAR(100) NOT NULL,
	    "email" VARCHAR(15) NOT NULL,
        "password" VARCHAR(15) NOT NULL,
        "department" VARCHAR(100) NOT NULL,
        "roll" VARCHAR(100) NOT NULL,
	    PRIMARY KEY ("id")
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
        FOREIGN KEY (user_id) REFERENCES users(id)
    );`;

execute(user).then(result => {
    if (result) {
        console.log('Table created');
    }
});

execute(research_projects).then(result => {
    if (result) {
        console.log('Table created');
    }
});

//client.query('select * from user',(err,result)=>{
//    if(!err){
//        console.log(result.rows)
//    }
//    client.end()
//})

module.exports = pool