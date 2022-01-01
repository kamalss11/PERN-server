const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const router = express.Router()
const cors = require('cors')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')

// const bodyParser = require("body-parser");
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: '../PERN-Client-main/public/Uploads/',
    filename:(req, file, cb) => {
        return cb(null, Date.now()+file.originalname);
    }
})

const upload = multer({storage:storage})

router.use(cors())
router.use(express.json())

const pool = require('../Db/db')

router.post('/', async (req,res) => {
    const {name,email,password,cpassword,department,roll} = req.body
    if(!name || !email ||  !department || !password || !roll){
        return res.status(422).json({error: "Fill the fields"})
    }

    if(password != cpassword){
        return res.status(422).json({error: "Mismatch password"})
    }

    try{
        let pss = await bcrypt.hash(password,10)
        pool.query(
            `SELECT email FROM users WHERE email = '${email}'`,
            (err, result) => {
                if(result.rows != ''){
                    return res.status(422).json({error: "Mail already exists"})
                }
            }
        );

        pool.query(
            `INSERT INTO users (name,email,password,department,roll) VALUES($1,$2,$3,$4,$5)`,[name,email,pss,department,roll],
            (err, result) => {
                return res.status(201).json({message: "User Registered Successfully"})
            }
        );
    }catch(err){
        console.log(err+'22')
    }
})

router.post('/signin', async(req,res) => {
    try{
        const {email,password} = req.body
        if(!email || !password){
            return res.status(400).send({error: "Fill the data"})
        }
        
        pool.query(
            `SELECT * FROM users WHERE email = '${email}'`,
            async (err, result) => {
                if(result.rows != ''){
                    res.cookie("user_id",result.rows[0].user_id) 

                    let token = jwt.sign(result.rows[0].user_id,process.env.SECRET_KEY)
                    console.log(token)
        
                    res.cookie("jwtoken",token,{
                        expires: new Date(Date.now() + 25892000000),
                        httpOnly: true
                    })

                    let passmatch = await bcrypt.compare(password,result.rows[0].password)
                    console.log(passmatch)

                    if(passmatch){
                        return res.send({login : result.rows})
                    }
                    else{
                        res.status(400).send({error: "Login credentials Error"})
                    }
                }
                else{
                    res.status(400).send({error: "No user found"})
                }
            }
        );
    }
    catch(err){
        console.log(err)
    }
})

router.post('/forget_password',async (req,res)=>{
    const {email} = req.body
    try{
        console.log(email)
        let tkn,e

        crypto.randomBytes(32, (err, buffer) => {
            if (err) {
                console.log(err)
            }        
            tkn = buffer.toString("hex")

            res.cookie("reset_password",tkn,{
                expires : new Date(Date.now() + 300000),
                httpOnly : true
            })
            console.log('Reset Token - ' + tkn)
        })
            
        pool.query(
            `SELECT email FROM users WHERE email = '${email}'`, 
            (err, result) => {
                console.log(result.rows)
                if(result.rows.length == 0){
                    return res.status(201).json({sp : 'No Account found with this mail'})
                }
                // return res.status(422).json({ data: "Mail" })
            }
        );

        pool.query(
            `SELECT email FROM reset_password WHERE email = '${email}'`,
            async (err, result) => {
                let create = Date.now()
                let expire = Date.now() + 300000
                if (result.rows != '') {
                    pool.query(
                        `UPDATE reset_password set createdat=$1,expiresat=$2,token=$3 WHERE email = $4`, [create, expire, tkn, email],(err,result)=>{
                            console.log(result.rows[0])
                            res.status(201).json({sp : 'Token Inserted'})
                        }
                    )
                }
                else {
                    pool.query(
                        `INSERT INTO reset_password (email,createdat,expiresat,token) VALUES($1,$2,$3,$4)`, [email, create, expire, tkn],(err,result)=>{
                            console.log(result.rows[0])
                            res.status(201).json({sp : 'Token Inserted'})
                        }
                    )
                }
                // create reusable transporter object using the default SMTP transport
                var transporter = nodemailer.createTransport(smtpTransport({
                    service: 'gmail',
                    auth: {
                        user: 'kamalesh1132002@gmail.com',
                        pass: 'kamalesh5050'
                    }
                }))
                var mailOptions = {
                    from: 'ikamaloffc@gmail.com',
                    to: req.body.email,
                    subject: 'ResetPassword',
                    html: `<p>Reset Password Link - </p> + <a href=http://localhost:3000/reset_password/${tkn}>Link</a>`
                }
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error + '3115')
                    } else {
                        console.log('Email sent: ' + info.response)
                    }
                })
                if (err) {
                    console.log(err)
                }
            }
        );

    }catch(err){
        console.log(err,"169")
    }
})

router.put('/reset_password',async (req,res)=>{
    const {pass,email} = req.body
    try{
        let pss = await bcrypt.hash(pass,10)
        pool.query(
            `SELECT * FROM reset_password WHERE email = '${email}'`,(err,result)=>{
                console.log(result.rows[0])
                console.log(result.rows[0].token,req.cookies.reset_password)
                if(result.rows.length > 0){
                    if(req.cookies.reset_password === result.rows[0].token){
                        let exp = result.rows[0].expiresat
                        let exresult = exp - Date.now()
                        console.log(Date.now() , exp)
                        console.log(exresult)

                        if(exresult < 0){
                            res.status(400).json({error : 'Token Expires'})
                        }
                        else{
                            pool.query(
                                `UPDATE users set password = $1 WHERE email = $2`,[pss,email],(err,result)=>{
                                    res.clearCookie('reset_password',{path: '/'})
                                    res.status(201).json({dd : 'Password Changed'})
                                }
                            )
                        }
                    }
                    console.log('wt ?')
                }
                else{
                    res.status(400).send({error : 'No Token Found'})
                }
            }
        )
    }catch(err){
        console.log(err,"169")
    }
})

router.get('/admin/:id', async(req,res) => {
    let research_projects = [],patents = [],awards_for_innovation = [],degree = [],fellowship = [],
    collab_activ = [],linkages = [],mou = [],
    conference = [],guest_lectures = [],extension_activities = [],industrial_visits = [],evs = [],departmental_activities = [],
    projects_services = [],
    honours = [],exams = [],books_published = [],chapters_contributed = [],conference_proceeding = [],paper_presentation = [],journal_publications = [],fconference = [],resource_person = [],
        financial_support = [],development_programmes = [],online_courses = [],e_content = []
    let length
    try{
        pool.query(
            `SELECT user_id FROM users WHERE department = '${req.params.id}'`,
            (err, result) => {
                usr = result.rows
                console.log(usr)  
                length = usr.length 
                console.log(length)  

                for(let i=0;i<length;i++){
                    let val = usr[i].user_id
                    console.log(val)
                    pool.query(
                        `SELECT * FROM research_projects WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                research_projects.push(result.rows)
                            }
                        }
                    );   
                    
                    pool.query(
                        `SELECT * FROM patents WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                patents.push(result.rows)
                            }          
                        }
                    );

                    pool.query(
                        `SELECT * FROM awards_for_innovation WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                awards_for_innovation.push(result.rows)
                            }  
                        }
                    );

                    pool.query(
                        `SELECT * FROM degree WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                degree.push(result.rows)
                            }            
                        }
                    );

                    pool.query(
                        `SELECT * FROM fellowship WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                fellowship.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM collab_activ WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                collab_activ.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM linkages WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                linkages.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM mou WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                mou.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM conference WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                conference.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM guest_lectures WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                guest_lectures.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM extension_activities WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                extension_activities.push(result.rows)
                            }                       
                        }
                    );

                    pool.query(
                        `SELECT * FROM industrial_visits WHERE user_id = ${val}`,
                        (err, result) => {
                            if(result.rows!=''){
                                industrial_visits.push(result.rows)
                            }                       
                        }
                    );

                pool.query(
                    `SELECT * FROM evs WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            evs.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM departmental_activities WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            departmental_activities.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM projects_services WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            projects_services.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM honours WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            honours.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM exams WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            exams.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM books_published WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            books_published.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM chapters_contributed WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            chapters_contributed.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM paper_presentation WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            paper_presentation.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM journal_publications WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            journal_publications.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM fconference WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            fconference.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM resource_person WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            resource_person.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM financial_support WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            financial_support.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM development_programmes WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            development_programmes.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM online_courses WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            online_courses.push(result.rows)
                        }                       
                    }
                );

                pool.query(
                    `SELECT * FROM e_content WHERE user_id = ${val}`,
                    (err, result) => {
                        if(result.rows!=''){
                            e_content.push(result.rows)
                        }   
        
                        if(i+1 === length){               
                            return res.send({
                                research_projects : research_projects,
                                patents : patents,
                                awards_for_innovation : awards_for_innovation,
                                degree : degree,
                                fellowship : fellowship,
                                collab_activ : collab_activ,
                                linkages : linkages,
                                mou : mou,
                                conference : conference,
                                guest_lectures : guest_lectures,
                                extension_activities : extension_activities,
                                industrial_visits : industrial_visits,
                                evs : evs,
                                departmental_activities : departmental_activities,
                                projects_services : projects_services,
                                honours : honours,
                                exams : exams,
                                books_published : books_published,
                                chapters_contributed : chapters_contributed,
                                conference_proceeding : conference_proceeding,
                                paper_presentation : paper_presentation,
                                journal_publications : journal_publications,
                                fconference : fconference,
                                resource_person : resource_person,
                                financial_support : financial_support,
                                development_programmes : development_programmes,
                                online_courses : online_courses,
                                e_content : e_content
                            })                                    
                        }
                    }
                );
                }     
            }
        );     
    }
    catch(er){
        console.log(er)
    }
})

router.get('/period/:prd',async(req,res) =>{
    console.log(req.params.prd)
    // pool.query(
    //     `SELECT * FROM research_projects WHERE date between ${req.params.prd}`,
    //     function (err, result) {
    //         console.log(result)
    //         return res.json(result.rows)
    //     }
    // );
    let research_projects,patents,awards_for_innovation,degree,fellowship,
    collab_activ,linkages,mou,
    conference,guest_lectures,extension_activities,industrial_visits,evs,departmental_activities,
    projects_services,
    honours,exams,books_published,chapters_contributed,conference_proceeding,paper_presentation,journal_publications,fconference,resource_person,
        financial_support,development_programmes,online_courses,e_content
    try{
            pool.query(
                `SELECT * FROM research_projects WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        research_projects = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }
                }
            );
    
            pool.query(
                `SELECT * FROM patents WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        patents = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }           
                }
            );
    
            pool.query(
                `SELECT * FROM awards_for_innovation WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        awards_for_innovation = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }            
                }
            );
    
            pool.query(
                `SELECT * FROM degree WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        degree = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }           
                }
            );
    
            pool.query(
                `SELECT * FROM fellowship WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        fellowship = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM collab_activ WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        collab_activ = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }            
                }
            );
    
            pool.query(
                `SELECT * FROM linkages WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        linkages = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }              
                }
            );
    
            pool.query(
                `SELECT * FROM mou WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        mou = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }            
                }
            );
    
            pool.query(
                `SELECT * FROM conference WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        conference = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM guest_lectures WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        guest_lectures = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }            
                }
            );
    
            pool.query(
                `SELECT * FROM extension_activities WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        extension_activities = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM industrial_visits WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        industrial_visits = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM evs WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        evs = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }           
                }
            );
    
            pool.query(
                `SELECT * FROM departmental_activities WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        departmental_activities = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }            
                }
            );
    
            pool.query(
                `SELECT * FROM projects_services WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        projects_services = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM honours WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        honours = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM exams WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        exams = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM books_published WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        books_published = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }                
                }
            );
    
            pool.query(
                `SELECT * FROM chapters_contributed WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        chapters_contributed = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }                           
                }
            );
    
            pool.query(
                `SELECT * FROM conference_proceeding WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        conference_proceeding = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM paper_presentation WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        paper_presentation = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }    
                }
            );
    
            pool.query(
                `SELECT * FROM journal_publications WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        journal_publications = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }              
                }
            );
    
            pool.query(
                `SELECT * FROM fconference WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        fconference = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }            
                }
            );
    
            pool.query(
                `SELECT * FROM resource_person WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        resource_person = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM financial_support WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        financial_support = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM development_programmes WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        development_programmes = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }           
                }
            );
    
            pool.query(
                `SELECT * FROM online_courses WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        online_courses = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM e_content WHERE date between ${req.params.prd} AND user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        e_content = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }             
                }
            );
    
            pool.query(
                `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    return res.send(
                        {
                            user : result.rows,
                            research_projects : research_projects,
                            patents : patents,
                            awards_for_innovation : awards_for_innovation,
                            degree : degree,
                            fellowship : fellowship,
                            collab_activ : collab_activ,
                            linkages : linkages,
                            mou : mou,
                            conference : conference,
                            guest_lectures : guest_lectures,
                            extension_activities : extension_activities,
                            industrial_visits : industrial_visits,
                            evs : evs,
                            departmental_activities : departmental_activities,
                            projects_services : projects_services,
                            honours : honours,
                            exams : exams,
                            books_published : books_published,
                            chapters_contributed : chapters_contributed,
                            conference_proceeding : conference_proceeding,
                            paper_presentation : paper_presentation,
                            journal_publications : journal_publications,
                            fconference : fconference,
                            resource_person : resource_person,
                            financial_support : financial_support,
                            development_programmes : development_programmes,
                            online_courses : online_courses,
                            e_content : e_content
                        }
                    )            
                }
            );

    }
    catch(err){
        console.log(err)
    }
})

router.get('/dashboard',async(req,res) => {                    
    const vtoken = req.cookies.jwtoken
    const verifyToken = jwt.verify(vtoken,process.env.SECRET_KEY)
    console.log(`${verifyToken}dashboard`)

    if(verifyToken){
        let research_projects,patents,awards_for_innovation,degree,fellowship,
        collab_activ,linkages,mou,
        conference,guest_lectures,extension_activities,industrial_visits,evs,departmental_activities,
        projects_services,
        honours,exams,books_published,chapters_contributed,conference_proceeding,paper_presentation,journal_publications,fconference,resource_person,
            financial_support,development_programmes,online_courses,e_content
        try{
            if(req.cookies.user_id){
                pool.query(
                    `SELECT * FROM research_projects WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            research_projects = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }
                    }
                );
        
                pool.query(
                    `SELECT * FROM patents WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            patents = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }           
                    }
                );
        
                pool.query(
                    `SELECT * FROM awards_for_innovation WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            awards_for_innovation = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }            
                    }
                );
        
                pool.query(
                    `SELECT * FROM degree WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            degree = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }           
                    }
                );
        
                pool.query(
                    `SELECT * FROM fellowship WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            fellowship = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM collab_activ WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            collab_activ = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }            
                    }
                );
        
                pool.query(
                    `SELECT * FROM linkages WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            linkages = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }              
                    }
                );
        
                pool.query(
                    `SELECT * FROM mou WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            mou = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }            
                    }
                );
        
                pool.query(
                    `SELECT * FROM conference WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            conference = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM guest_lectures WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            guest_lectures = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }            
                    }
                );
        
                pool.query(
                    `SELECT * FROM extension_activities WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            extension_activities = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM industrial_visits WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            industrial_visits = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM evs WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            evs = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }           
                    }
                );
        
                pool.query(
                    `SELECT * FROM departmental_activities WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            departmental_activities = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }            
                    }
                );
        
                pool.query(
                    `SELECT * FROM projects_services WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            projects_services = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM honours WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            honours = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM exams WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            exams = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM books_published WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            books_published = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }                
                    }
                );
        
                pool.query(
                    `SELECT * FROM chapters_contributed WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            chapters_contributed = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }                           
                    }
                );
        
                pool.query(
                    `SELECT * FROM conference_proceeding WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            conference_proceeding = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM paper_presentation WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            paper_presentation = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }    
                    }
                );
        
                pool.query(
                    `SELECT * FROM journal_publications WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            journal_publications = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }              
                    }
                );
        
                pool.query(
                    `SELECT * FROM fconference WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            fconference = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }            
                    }
                );
        
                pool.query(
                    `SELECT * FROM resource_person WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            resource_person = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM financial_support WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            financial_support = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM development_programmes WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            development_programmes = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }           
                    }
                );
        
                pool.query(
                    `SELECT * FROM online_courses WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            online_courses = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM e_content WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        if(result.rows != ''){
                            e_content = result.rows 
                        }          
                        else{
                            console.log("no values")
                        }             
                    }
                );
        
                pool.query(
                    `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
                    (err, result) => {
                        return res.send(
                            {
                                user : result.rows,
                                research_projects : research_projects,
                                patents : patents,
                                awards_for_innovation : awards_for_innovation,
                                degree : degree,
                                fellowship : fellowship,
                                collab_activ : collab_activ,
                                linkages : linkages,
                                mou : mou,
                                conference : conference,
                                guest_lectures : guest_lectures,
                                extension_activities : extension_activities,
                                industrial_visits : industrial_visits,
                                evs : evs,
                                departmental_activities : departmental_activities,
                                projects_services : projects_services,
                                honours : honours,
                                exams : exams,
                                books_published : books_published,
                                chapters_contributed : chapters_contributed,
                                conference_proceeding : conference_proceeding,
                                paper_presentation : paper_presentation,
                                journal_publications : journal_publications,
                                fconference : fconference,
                                resource_person : resource_person,
                                financial_support : financial_support,
                                development_programmes : development_programmes,
                                online_courses : online_courses,
                                e_content : e_content
                            }
                        )            
                    }
                );
            }
    
            else{
                console.log("Not logged")
            }
        }
        catch(er){
            console.log(er)
        }
    }
    else{
        return res.status(422).json({error: "Token Expires"})
    }

    
})

router.get('/dashboard_student',async(req,res) => {
    let publication,achievement
    try{
        if(req.cookies.user_id){
            pool.query(
                `SELECT * FROM publications WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        publication = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }
                }
            );
    
            pool.query(
                `SELECT * FROM achievements WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    if(result.rows != ''){
                        achievement = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }           
                }
            );
    
            pool.query(
                `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    return res.send(
                        {
                            user : result.rows,
                            publication : publication,
                            achievement : achievement
                        }
                    )            
                }
            );
        }

        else{
            console.log("Not logged")
        }
    }
    catch(er){
        console.log(er)
    }
})

router.get('/dashboard/profile',(req,res) => {
    try{
        pool.query(
            `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
            (err, result) => {
                res.send(result.rows)
            }
        );
    }
    catch(er){
        console.log(er)
    }
})

router.put('/dashboard/editprofile/:id',async (req,res) => {
    try{
        var {name,password,cpassword,ppassword,hashpassword,department} = req.body
        if(!name && !password && !cpassword  && !department){
            return res.status(400).json({error: "Fill the data"})
        }

        else if(name && !password){
            pool.query(
                `UPDATE users set name = $1 WHERE user_id = $2`,[name,req.params.id],
                (err, result) => {
                    res.send(result.rows)
                }
            );
        }

        else if(password && cpassword && ppassword && hashpassword && !name){
            const ps = await bcrypt.hash(password,10)

            let pscmp = await bcrypt.compare(ppassword,hashpassword)

            if(pscmp){
                pool.query(
                    `UPDATE users set password = $1 WHERE user_id = $2`,[ps,req.params.id],
                    (err, result) => {
                        res.send(result.rows)
                    }
                );
            }
            else{
                res.send({error : "Password was wrong"})
            }
        }
    }
    catch(err){
        console.log(err)
    }
})

router.post('/forms/research/research_projects',upload.single('image'),async(req,res) => {
    // const {dat} = req.file
    // const file = req.file
    console.log(req.file,req.body)
    console.log(req.file.filename)
    // const {user_id,n,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date} = req.body
    try{
        pool.query(
            `INSERT INTO research_projects (user_id,nam,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,image) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.user_id,req.body.n,req.body.title,req.body.no,req.body.amount_sanctioned,req.body.fileno,req.body.amount_received,req.body.date_sanctioned,req.body.funding_agency,req.body.date,req.file.filename],
            (err, result) => {              
                if(result){
                res.send({sp : "Saved"})}
                console.log(err)

            }
        )
    }catch(err){
        console.log(err+'22')
    }
})

// router.post('/forms/research/research_projects', async(req,res) => {
//     const {user_id,n,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date} = req.body
//     console.log(req.body)
//     try{
//         pool.query(
//             `INSERT INTO research_projects (user_id,nam,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[user_id,n,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date],
//             (err, result) => {              
//                 res.send({sp : "Saved"})
//             }
//         );
//     }catch(err){
//         console.log(err+'22')
//     }
// })

router.put('/forms/research/research_projects/edit', async(req,res) => {
    const {title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,id} = req.body
    try{
        const rp = pool.query(
            `UPDATE research_projects SET title=$1, no=$2, amount_sanctioned=$3, fileno=$4, amount_received=$5, date_sanctioned=$6, funding_agency=$7, date=$8 WHERE id=$9`,[title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,id],
            function (err, result) {
                console.log(err, result)
                res.send({sc : "Suceess"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.get('/forms/research/research_projects/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM research_projects WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/research_projects/delete/:id', async(req,res) => {
    console.log(req.params.id)
    try{
        pool.query(
            `DELETE FROM research_projects WHERE id = ${req.params.id} `,
            function (err, result) {
                console.log("Deleted")
                return res.status(201).json({message: "Deleted"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/patents', async(req,res) => {
    const {title,n,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date,user_id} = req.body
    try{
        pool.query(
        `INSERT INTO patents (user_id,n,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[user_id,n,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date],
        (err, result) => {
          res.send({sp : "Saved"})
        }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/patents/edit', async(req,res) => {
    const {id,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date} = req.body
    try{
        pool.query(
            `UPDATE patents SET title=$1,field=$2,fileno=$3,date_awarded_patent=$4,royalty_received=$5,providing_agency=$6,country=$7,date=$8 WHERE id=$9`,[title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date,id],
            function (err, result) {
                res.send({sp : "updated"})
            }   
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/research/patents/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM patents WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/patents/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM patents WHERE id = ${req.params.id} `,
            function (err, result) {                
                return res.status(201).json({message: "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/awards_for_innovation', async(req,res) => {
    const {user_id,n,awardee_name,designation,award_category,title,awarding_agency,venue,level,date} = req.body
    try{
        pool.query(
            `INSERT INTO awards_for_innovation (user_id,n,awardee_name,designation,award_category,title,awarding_agency,venue,level,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[user_id,n,awardee_name,designation,award_category,title,awarding_agency,venue,level,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/awards_for_innovation/edit', async(req,res) => {
    const {id,awardee_name,designation,award_category,title,awarding_agency,venue,level,date} = req.body
    try{
        pool.query(
            `UPDATE awards_for_innovation SET awardee_name=$1,designation=$2,award_category=$3,title=$4,awarding_agency=$5,venue=$6,level=$7,date=$8 WHERE id=$9`,[awardee_name,designation,award_category,title,awarding_agency,venue,level,date,id],
            function (err, result) {
                res.send({sp : "updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/research/awards_for_innovation/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM awards_for_innovation WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/awards_for_innovation/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM awards_for_innovation WHERE id = ${req.params.id} `,
            function (err, result) {
                console.log("Deleted")
                return res.status(201).json({message: "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/deg', async(req,res) => {
    const {user_id,n,deg,guide_name,title,external,venue,date} = req.body
    try{
        pool.query(
            `INSERT INTO degree (user_id,n,deg,guide_name,title,external,venue,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[user_id,n,deg,guide_name,title,external,venue,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/deg/edit', async(req,res) => {
    const {id,deg,guide_name,title,external,venue,date} = req.body
    try{
        pool.query(
            `UPDATE deg SET deg=$1,guide_name=$2,title=$3,external=$4,venue=$5,date=$6 WHERE id=$7`,[deg,guide_name,title,external,venue,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/research/deg/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM deg WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/deg/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM deg WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({message : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/fellowship', async(req,res) => {
    const {user_id,n,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date} = req.body
    try{
        pool.query(
            `INSERT INTO fellowship (user_id,n,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/fellowship/edit', async(req,res) => {
    const {id,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date} = req.body
    try{
        pool.query(
            `UPDATE fellowship SET fellowship=$1,date_sanctioned=$2,funding_agency=$3,sanctioned_amount=$4,date=$5 WHERE id=$6`,[fellowship,date_sanctioned,funding_agency,sanctioned_amount,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/research/fellowship/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM fellowship WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/fellowship/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM fellowship WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/collaborative_activities', async(req,res) => {
    const {user_id,n,activity,participant,financial_support,period,date} = req.body
    try{
        pool.query(
            `INSERT INTO collab_activ (user_id,n,activity,participant,financial_support,period,date) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,activity,participant,financial_support,period,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/collaborative_activities/edit', async(req,res) => {
    const {id,activity,participant,financial_support,period,date} = req.body
    try{
        pool.query(
            `UPDATE collaborative_activities SET activity=$1,participant=$2,financial_support=$3,period=$4,date=$5} WHERE id=$6`,[activity,participant,financial_support,period,date,id],
            function (err, res) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/collaborations/collaborative_activities/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM collab_activ WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/collaborative_activities/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM collab_activ WHERE id = ${req.params.id} `,
            function (err, res) {
                console.log(err, res)
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/linkages', async(req,res) => {
    const {user_id,n,title,partnering_agency,period,date} = req.body
    try{
        pool.query(
            `INSERT INTO linkages (user_id,n,title,partnering_agency,period,date) VALUES($1,$2,$3,$4,$5,$6)`,[user_id,n,title,partnering_agency,period,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/linkages/edit', async(req,res) => {
    const {id,title,partnering_agency,period,date} = req.body
    try{
        pool.query(
            `UPDATE linkages SET title=$1,partnering_agency=$2,period=$3,date=$4 WHERE id=$5`,[title,partnering_agency,period,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/collaborations/linkages/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM linkages WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/linkages/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM linkages WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/mou', async(req,res) => {
    const {user_id,n,organization,date_signed,period,participants,purpose,total,date} = req.body
    try{
        pool.query(
            `INSERT INTO mou (user_id,n,organization,date_signed,period,participants,purpose,total,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,n,organization,date_signed,period,participants,purpose,total,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/mou/edit', async(req,res) => {
    const {id,organization,date_signed,period,participants,purpose,total,date} = req.body
    try{
        pool.query(
            `UPDATE mou SET organization=$1,date_signed=$2,period=$3,participants=$4,purpose=$5,total=$6,date=$7 WHERE id=$8`,[organization,date_signed,period,participants,purpose,total,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/collaborations/mou/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM mou WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/mou/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM mou WHERE id = ${req.params.id} `,
            function (err, res) {
                console.log(err, res)
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/conference', async(req,res) => {
    const {user_id,n,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date} = req.body
    try{
        pool.query(
            `INSERT INTO conference (user_id,n,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[user_id,n,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/conference/edit', async(req,res) => {
    const {id,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date} = req.body
    try{
        pool.query(
            `UPDATE conference SET con_sem=$1,title=$2,sponsoring_agency=$3,resource_person=$4,venue=$5,objective=$6,outcome=$7,level=$8,total=$9,date=$10 WHERE id=$11`,[con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );        
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/events/conference/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM conference WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/conference/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM conference WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/guest_lectures', async(req,res) => {
    const {user_id,n,resource_person,designation,topic,venue,objective,outcome,total,date} = req.body
    try{
        pool.query(
            `INSERT INTO guest_lectures (user_id,n,resource_person,designation,topic,venue,objective,outcome,total,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[user_id,n,resource_person,designation,topic,venue,objective,outcome,total,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/guest_lectures/edit', async(req,res) => {
    const {id,resource_person,designation,topic,date_venue,objective,outcome,total,date} = req.body
    try{
        pool.query(
            `UPDATE guest_lectures SET resource_person=$1,designation=$2,topic=$3,date_venue=$4,objective=$5,outcome=$6,total=$7,date=$8 WHERE id=$9`,[resource_person,designation,topic,date_venue,objective,outcome,total,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );        
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/events/guest_lectures/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM guest_lectures WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/guest_lectures/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM guest_lectures WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/extension_activities', async(req,res) => {
    const {user_id,n,activities,collaborations,venue,total,date} = req.body
    try{
        pool.query(
            `INSERT INTO extension_activities(user_id,n,activities,collaborations,venue,total,date) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,activities,collaborations,venue,total,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/extension_activities/edit', async(req,res) => {
    const {id,activities,collaborations,venue,total,date} = req.body
    try{
        pool.query(
            `UPDATE extension_activities SET activities=$1,collaborations=$2,venue=$3,total=$4,date=$5 WHERE id=$6`,[activities,collaborations,venue,total,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );     
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/events/extension_activities/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM extension_activities WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/extension_activities/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM extension_activities WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/industrial_visits', async(req,res) => {
    const {user_id,n,classes,date,address,total,outcome} = req.body
    try{
        pool.query(
            `INSERT INTO industrial_visits(user_id,n,classes,date,address,total,outcome) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,classes,date,address,total,outcome],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/industrial_visits/edit', async(req,res) => {
    const {id,classes,date,address,total,outcome} = req.body
    try{
        pool.query(
            `UPDATE industrial_visits SET classes=$1,date=$2,address=$3,total=$4,outcome=$5 WHERE id=$6`,[classes,date,address,total,outcome,id],
            function (err, result) {
               res.send({sp : "Updated"})
            }
        );     
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/events/industrial_visits/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM industrial_visits WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/industrial_visits/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM industrial_visits WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/evs', async(req,res) => {
    const {user_id,date,place,total,activity} = req.body
    try{
        pool.query(
            `INSERT INTO evs(user_id,n,date,place,total,activity) VALUES($1,$2,$3,$4,$5,$6)`,[user_id,n,date,place,total,activity],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/evs/edit', async(req,res) => {
    const {id,date,place,total,activity} = req.body
    try{
        pool.query(
            `UPDATE evs SET date=$1,place=$2,total=$3,activity=$4 WHERE id=$5`,[date,place,total,activity,id],
            function (err, result) {
                res.send({sp : "updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/events/evs/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM evs WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/evs/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM evs WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/departmental_activities', async(req,res) => {
    const {user_id,n,activity,guest,topic,total,venue,filled,date} = req.body
    try{
        pool.query(
            `INSERT INTO departmental_activities(user_id,n,activity,guest,topic,total,venue,filled,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,n,activity,guest,topic,total,venue,filled,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/departmental_activities/edit', async(req,res) => {
    const {id,activity,guest,topic,total,venue,date} = req.body
    try{
        pool.query(
            `UPDATE departmental_activities SET activity=$1,guest=$2,topic=$3,total=$4,venue=$5,date=$6 WHERE id=$7`,[activity,guest,topic,total,venue,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/events/departmental_activities/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM departmental_activities WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/departmental_activities/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM departmental_activities WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/consultancy/projects_services', async(req,res) => {
    const {user_id,n,title,no,revenue_generated,date_sanction,sponsor,date} = req.body
    try{
        pool.query(
            `INSERT INTO projects_services(user_id,n,title,no,revenue_generated,date_sanction,sponsor,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[user_id,n,title,no,revenue_generated,date_sanction,sponsor,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/consultancy/projects_services/edit', async(req,res) => {
    const {id,title,no,revenue_generated,date_sanction,sponsor,date} = req.body
    try{
        pool.query(
            `UPDATE projects_services SET title=$1,no=$2,revenue_generated=$3,date_sanction=$4,sponsor=$5,date=$6 WHERE id=$7`,[title,no,revenue_generated,date_sanction,sponsor,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/consultancy/projects_services/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM projects_services WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/consultancy/projects_services/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM projects_services WHERE id = ${req.params.id} `,
            function (err, res) {
                console.log(err, res)
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/honours', async(req,res) => {
    const {user_id,n,award_honour,details,venue,level,date} = req.body
    try{
        pool.query(
            `INSERT INTO honours(user_id,n,award_honour,details,venue,level,date) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,award_honour,details,venue,level,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/honours/edit', async(req,res) => {
    const {id,award_honour,details,venue,level,date} = req.body
    try{
        pool.query(
            `UPDATE honours SET award_honour=$1,details=$2,venue=$3,level=$4,date=$5 WHERE id=$6`,[award_honour,details,venue,level,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/honours/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM honours WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/honours/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM honours WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/exams', async(req,res) => {
    const {user_id,exam,exam_rollno,date} = req.body
    try{
        pool.query(
            `INSERT INTO exams(user_id,n,exam,exam_rollno,date) VALUES($1,$2,$3,$4,$5)`,[user_id,n,exam,exam_rollno,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/exams/edit', async(req,res) => {
    const {id,exam,exam_rollno,date} = req.body
    try{
        pool.query(
            `UPDATE exams SET exam=$1,exam_rollno=$2,date=$3 WHERE id=$4`,[exam,exam_rollno,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/exams/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM exams WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/exams/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM exams WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/books_published', async(req,res) => {
    const {user_id,n,name,publisher,level,isbn_no,date} = req.body
    try{
        pool.query(
            `INSERT INTO books_published(user_id,n,name,publisher,level,isbn_no,date) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,name,publisher,level,isbn_no,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/books_published/edit', async(req,res) => {
    const {id,name,publisher,level,isbn_no,date} = req.body
    try{
        pool.query(
            `UPDATE books_published SET name=$1,publisher=$2,level=$3,isbn_no=$4,date=$5 WHERE id=$6`,[name,publisher,level,isbn_no,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/books_published/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM books_published WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/books_published/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM books_published WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/chapters_contributed', async(req,res) => {
    const {user_id,n,title,chapter,editor,publisher,level,isbn_no,date} = req.body
    try{
        pool.query(
            `INSERT INTO chapters_contributed(user_id,n,title,chapter,editor,publisher,level,isbn_no,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,n,title,chapter,editor,publisher,level,isbn_no,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/chapters_contributed/edit', async(req,res) => {
    const {id,title,chapter,editor,publisher,level,isbn_no,date} = req.body
    try{
        pool.query(
            `UPDATE chapters_contributed SET title=$1,chapter=$2,editor=$3,publisher=$4,level=$5,isbn_no=$6,date=$7 WHERE id=$8`,[title,chapter,editor,publisher,level,isbn_no,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/chapters_contributed/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM chapters_contributed WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/chapters_contributed/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM chapters_contributed WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/conference_proceeding', async(req,res) => {
    const {user_id,n,con,publication,level,isbn_no,date} = req.body
    try{
        pool.query(
            `INSERT INTO conference_proceeding(user_id,n,con,publication,level,isbn_no,date) VALUES($1,$2,$3,$4,$5,$6,$7)`,[user_id,n,con,publication,level,isbn_no,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference_proceeding/edit', async(req,res) => {
    const {id,con,publication,level,isbn_no,date} = req.body
    try{
        pool.query(
            `UPDATE conference_proceeding SET con=$1,publication=$2,level=$3,isbn_no=$4,date=$5 WHERE id=$6`,[con,publication,level,isbn_no,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );    
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/conference_proceeding/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM conference_proceeding WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference_proceeding/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM conference_proceeding WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/paper_presentation', async(req,res) => {
    const {user_id,n,con,title,financial_support,venue,level,date} = req.body
    try{
        pool.query(
            `INSERT INTO paper_presentation(user_id,n,con,title,financial_support,venue,level,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,n,con,title,financial_support,venue,level,date],
            (err, result) => {
              res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/paper_presentation/edit', async(req,res) => {
    const {id,con,title,financial_support,venue,level,date} = req.body
    try{
        pool.query(
            `UPDATE paper_presentation SET con=$1,title=$2,financial_support=$3,venue=$4,level=$5,date=$6 WHERE id=$7`,[con,title,financial_support,venue,level,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        ); 
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/paper_presentation/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM paper_presentation WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/paper_presentation/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM paper_presentation WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/journal_publications', async(req,res) => {
    const {user_id,n,title,jou,issn_no,volume,sci,impact,level,date} = req.body
    try{
        pool.query(
            `INSERT INTO journal_publications(user_id,n,title,jou,issn_no,volume,sci,impact,level,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[user_id,n,title,jou,issn_no,volume,sci,impact,level,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/journal_publications/edit', async(req,res) => {
    const {id,title,jou,issn_no,volume,sci,impact,level,date} = req.body
    try{
        pool.query(
            `UPDATE journal_publications SET title=$1,jou=$2,issn_no=$3,volume=$4,sci=$5,impact=$6,level=$7,date=$8 WHERE id=$9`,[title,jou,issn_no,volume,sci,impact,level,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/journal_publications/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM journal_publications WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/journal_publications/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM journal_publications WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/conference', async(req,res) => {
    const {user_id,n,con,title,venue,level,financial_support,programme_outcome,date} = req.body
    try{
        pool.query(
            `INSERT INTO fconference(user_id,n,con,title,venue,level,financial_support,programme_outcome,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,n,con,title,venue,level,financial_support,programme_outcome,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference/edit', async(req,res) => {
    const {id,con,title,venue,level,financial_support,programme_outcome,date} = req.body
    try{
        pool.query(
            `UPDATE fconference SET con=$1,title=$2,venue=$3,level=$4,financial_support=$5,programme_outcome=$6,date=$7 WHERE id=$8`,[con,title,venue,level,financial_support,programme_outcome,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/conference/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM conference WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM fconference WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/resource_person', async(req,res) => {
    const {user_id,n,topic,event,venue,level,filled,date} = req.body
    try{
        pool.query(
            `INSERT INTO resource_person(user_id,n,sem,topic,event,venue,level,filled,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,n,sem,topic,event,venue,level,filled,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/resource_person/edit', async(req,res) => {
    const {id,sem,topic,event,venue,level,date} = req.body
    try{
        pool.query(
            `UPDATE resource_person SET sem=$1,topic=$2,event=$3,venue=$4,level=$5,date=$6 WHERE id=$7`,[sem,topic,event,venue,level,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/resource_person/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM resource_person WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/resource_person/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM resource_person WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/financial_support', async(req,res) => {
    const {user_id,n,f,amount_support,date} = req.body
    try{
        pool.query(
            `INSERT INTO financial_support(user_id,n,f,amount_support,date) VALUES($1,$2,$3,$4,$5)`,[user_id,n,f,amount_support,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/financial_support/edit', async(req,res) => {
    const {id,f,amount_support,date} = req.body
    try{
        pool.query(
            `UPDATE financial_support SET f=$1,amount_support=$2,date=$3 WHERE id=$4`,[f,amount_support,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/financial_support/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM financial_support WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/financial_support/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM financial_support WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/development_programmes', async(req,res) => {
    const {user_id,n,training,title,venue,financial_support,level,date} = req.body
    try{
        pool.query(
            `INSERT INTO development_programmes(user_id,n,training,title,venue,financial_support,level,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[user_id,n,training,title,venue,financial_support,level,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/development_programmes/edit', async(req,res) => {
    const {id,training,title,venue,financial_support,level,date} = req.body
    try{
        pool.query(
            `UPDATE development_programmes SET training=$1,title=$2,venue=$3,financial_support=$4,level=$5,date=$6 WHERE id=$7`,[training,title,venue,financial_support,level,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/development_programmes/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM development_programmes WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/development_programmes/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM development_programmes WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/online_courses', async(req,res) => {
    const {user_id,n,training,title,duration,date,financial_support,level} = req.body
    try{
        pool.query(
            `INSERT INTO online_courses(user_id,n,training,title,duration,date,financial_support,level) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[user_id,n,training,title,duration,date,financial_support,level],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/online_courses/edit', async(req,res) => {
    const {id,training,title,duration,date,financial_support,level} = req.body
    try{
        pool.query(
            `UPDATE online_courses SET training=$1,title=$2,duration=$3,date=$4,financial_support=$5,level=$6 WHERE id=$7`,[training,title,duration,date,financial_support,level,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/online_courses/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM online_courses WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/online_courses/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM online_courses WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Deleted"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/e_content', async(req,res) => {
    const {user_id,n,module,platform,date} = req.body
    try{
        pool.query(
            `INSERT INTO e_content(user_id,n,module,platform,date) VALUES($1,$2,$3,$4,$5)`,[user_id,n,module,platform,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/e_content/edit', async(req,res) => {
    const {id,module,platform,date} = req.body
    try{
        pool.query(
            `UPDATE e_content SET module=$1,platform=$2,date=$3 WHERE id=$4`,[module,platform,date,id],
            function (err, result) {
                res.send({sp : "Updated"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/faculty/e_content/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM e_content WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/e_content/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM e_content WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Delete"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

// Stundets

router.post('/forms/publication/publications', async(req,res) => {
    const {user_id,department,namej,roll_no,title,journal,issn,volume_no,sci,link,impact,level,date} = req.body
    try{
        pool.query(
            `INSERT INTO publications(user_id,department,namej,roll_no,title,journal,issn,volume_no,sci,link,impact,level,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[user_id,department,namej,roll_no,title,journal,issn,volume_no,sci,link,impact,level,date],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/publication/publications/edit', async(req,res) => {
    const {id,department,namej,roll_no,title,journal,issn,volume_no,sci,link,impact,level,date} = req.body
    try{
        pool.query(
            `UPDATE publications set department=$1,namej=$2,roll_no=$3,title=$4,journal=$5,issn=$6,volume_no=$7,sci=$8,link=$9,impact=$10,level=$11,date=$12  WHERE id=$13)`,[department,namej,roll_no,title,journal,issn,volume_no,sci,link,impact,level,date,id],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/publication/publications/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM publications WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/publication/publications/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM publications WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Delete"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/achievement/achievements', async(req,res) => {
    const {user_id,department,name,roll_no,achievement,event,date,venue,level} = req.body
    try{
        pool.query(
            `INSERT INTO achievements (user_id,department,name,roll_no,achievement,event,date,venue,level) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,department,name,roll_no,achievement,event,date,venue,level],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/achievement/achievements/edit', async(req,res) => {
    const {id,department,name,roll_no,achievement,event,date,venue,level} = req.body
    try{
        pool.query(
            `UPDATE achievements set department=$1,name=$2,roll_no=$3,achievement=$4,event=$5,date=$6,venue=$7,level=$8  WHERE id=$10)`,[department,name,roll_no,achievement,event,date,venue,level,id],
            (err, result) => {
                res.send({sp : "Saved"})
            }
        );
    }catch(err){
        console.log(err)
    }
})

router.get('/forms/achievement/achievements/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM achievements WHERE id = ${req.params.id}`,
            function (err, result) {
                console.log(result.rows)
                res.json(result.rows)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/achievement/achievements/delete/:id/', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `DELETE FROM achievements WHERE id = ${req.params.id} `,
            function (err, result) {
                res.send({sp : "Delete"})
            }
        );
    }catch(err){
        console.log(err)
    }
})



router.get('/logout',(req,res) => {
    res.clearCookie('user_id',{ path: '/'})
    res.status(200).send('User Logout')
})

module.exports = router