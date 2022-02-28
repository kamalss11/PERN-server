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
                    res.cookie("department",result.rows[0].department,{
                        expires: new Date(Date.now() + 25892000000),
                        httpOnly: true
                    })

                    res.cookie("user_id",result.rows[0].user_id,{
                        expires: new Date(Date.now() + 25892000000),
                        httpOnly: true
                    })

                    let token = jwt.sign(result.rows[0].user_id,process.env.SECRET_KEY)
                    console.log(token)
        
                    res.cookie("jwtoken",token,{
                        expires: new Date(Date.now() + 25892000000),
                        httpOnly: true
                    })

                    let passmatch = await bcrypt.compare(password,result.rows[0].password)
                    console.log(passmatch)

                    if(passmatch){        
                        res.cookie("email",email,{
                            httpOnly: true
                        })
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
        var tkn,e
            
        pool.query(
            `SELECT email FROM users WHERE email = '${email}'`, 
            (err, result) => {
                console.log(result.rows)
                if(result.rows.length == 0){
                    return res.status(422).send({msg : 'No Account found with this mail'})
                }
                // return res.status(422).json({ data: "Mail" })
                else{
                    crypto.randomBytes(32, (err, buffer) => {
                        if (err) {
                            console.log(err)
                        }        
                        tkn = buffer.toString("hex")
            
                        res.cookie("reset_password",tkn,{
                            expires : new Date(Date.now() + 600000),
                            httpOnly : true
                        })
                        console.log('Reset Token - ' + tkn)
                    })
            
                    pool.query(
                        `SELECT email FROM reset_password WHERE email = '${email}'`,
                        async (err, result) => {
                            if (err) {
                                console.log(err)
                            }
                            if (result.rows != '') {
                                pool.query(
                                    `UPDATE reset_password set token=$1 WHERE email = $2`, [tkn, email],(err,result)=>{
                                        // console.log(result.rows)
                                    }
                                )
                            }
                            else {
                                pool.query(
                                    `INSERT INTO reset_password (email,token) VALUES($1,$2)`, [email,tkn],(err,result)=>{
                                        // console.log(result.rows)
                                    }
                                )
                            }
                            res.cookie("r_email",email,{
                                httpOnly: true
                            })

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
                                html: `<p>Click this <a href=http://localhost:3000/reset_password/${tkn}>Link</a> to reset your password</p>
                                <p>Link will valid only for 10 minutes.</p>
                                <p style='text-align:left'>Thanks & Regards</p>`
                            }
                            transporter.sendMail(mailOptions, function (error, info) {
                                if (error) {
                                    console.log(error + '3115')
                                } else {
                                    console.log('Email sent: ' + info.response)
                                    return res.status(422).send({s: 'Check your mail'})
                                }
                            })
                        }
                    );
                }
            }
        );


    }catch(err){
        console.log(err,"169")
    }
})

router.get('/reset_password',async (req,res)=>{
    try{
        console.log(req.cookies.r_email)
        pool.query(`SELECT *FROM reset_password WHERE email = '${req.cookies.r_email}'`,async (err, result) => {
                if (result.rows != '') {
                    return res.send({ rp: result.rows })
                }
                else {
                    return res.status(422).send({ error: 'Check your mail' })
                }
            })
    }
    catch(err){
        console.log(err)
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
                    if(req.cookies.reset_password){
                        pool.query(
                            `UPDATE users set password = $1 WHERE email = $2`,[pss,email],(err,result)=>{
                                res.clearCookie('reset_password',{path: '/'})
                                res.status(201).json({dd : 'Password Changed'})
                            }
                        )
                    }
                    else{
                        res.status(400).json({error : 'Link Expires'})
                    }
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

router.get('/super_admin/departments/staffs/:dprt', async(req,res) => {
    try{
            let research_projects ,patents ,awards_for_innovation ,degree ,fellowship ,collab_activ ,linkages ,mou ,conference ,guest_lectures ,extension_activities ,industrial_visits ,evs,departmental_activities ,projects_services ,honours ,exams ,books_published ,chapters_contributed ,conference_proceeding ,paper_presentation ,journal_publications ,fconference,resource_person ,financial_support ,development_programmes ,online_courses ,e_content 
            pool.query(
                `SELECT * FROM research_projects WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        research_projects = result.rows
                    }
                }
            );   
            
            pool.query(
                `SELECT * FROM patents WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        patents = result.rows
                    }          
                }
            );
            
            pool.query(
                `SELECT * FROM awards_for_innovation WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        awards_for_innovation = result.rows
                    }  
                }
            );
            
            pool.query(
                `SELECT * FROM degree WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        degree = result.rows
                    }            
                }
            );
            
            pool.query(
                `SELECT * FROM fellowship WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        fellowship = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM collab_activ WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        collab_activ = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM linkages WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        linkages = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM mou WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        mou = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM conference WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        conference = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM guest_lectures WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        guest_lectures = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM extension_activities WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        extension_activities = result.rows
                    }                       
                }
            );
            
            pool.query(
                `SELECT * FROM industrial_visits WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        industrial_visits = result.rows
                    }                       
                }
            );
    
            pool.query(
                `SELECT * FROM evs WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        evs = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM departmental_activities WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        departmental_activities = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM projects_services WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        projects_services = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM honours WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        honours = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM exams WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        exams = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM books_published WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        books_published = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM chapters_contributed WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        chapters_contributed = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM conference_proceeding WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        conference_proceeding = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM paper_presentation WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        paper_presentation = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM journal_publications WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        journal_publications = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM fconference WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        fconference = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM resource_person WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        resource_person = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM financial_support WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        financial_support = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM development_programmes WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        development_programmes = result.rows
                    }                       
                }
            )
            pool.query(
                `SELECT * FROM online_courses WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        online_courses = result.rows
                    }                       
                }
            );
    
            pool.query(
                `SELECT * FROM e_content WHERE department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows!=''){
                        e_content = result.rows
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
    catch(er){
        console.log(er)
    }
})

router.get('/super_admin/departments/students/:dprt', async(req,res) => {
    console.log(req.params.prd)

    let placements,publications,paper_presentation,conference,competition,training,projectwork,exams,online_courses,achievements
        
    try{
        pool.query(
            `SELECT * FROM placements WHERE department ='${req.params.dprt}'`,
            (err, result) => {
                if(result.rows != ''){
                    placements = result.rows 
                }          
                else{
                    console.log("no values")
                }
            }
        );
    
        pool.query(
            `SELECT * FROM s_publications WHERE department = '${req.params.dprt}'`,
            (err, result) => {
                if(result.rows != ''){
                    publications = result.rows 
                }          
                else{
                    console.log("no values")
                }           
            }
        );
    
        pool.query(
            `SELECT * FROM s_paper_presentation WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_conference WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_competition WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_training WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_projectwork WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_exams WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_onlinecourses WHERE department = '${req.params.dprt}'`,
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
            `SELECT * FROM s_achievements WHERE department = '${req.params.dprt}'`,
            (err, result) => {
                if(result.rows != ''){
                    guest_lectures = result.rows 
                }          
                else{
                    console.log("no values")
                }            
            }
        );

        console.log(publications)
    
        pool.query(
            `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
            (err, result) => {
                return res.send(
                    {
                        user : result.rows,
                        placements : placements,
                        publications : publications,
                        paper_presentation : paper_presentation,
                        conference : conference,
                        competition : competition,
                        training : training,
                        projectwork : projectwork,
                        exams : exams,
                        online_courses : online_courses,
                        achievements : achievements
                    }
                )            
            }
        );

    }
        catch(er){
            console.log(er)
        }
})

router.get('/period/:prd/:dprt',async(req,res) =>{
    console.log(req.params.prd)

    let research_projects,patents,awards_for_innovation,degree,fellowship,
    collab_activ,linkages,mou,
    conference,guest_lectures,extension_activities,industrial_visits,evs,departmental_activities,
    projects_services,
    honours,exams,books_published,chapters_contributed,conference_proceeding,paper_presentation,journal_publications,fconference,resource_person,
        financial_support,development_programmes,online_courses,e_content
        
    try{
            pool.query(
                `SELECT * FROM research_projects WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM patents WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM awards_for_innovation WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM degree WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM fellowship WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM collab_activ WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM linkages WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM mou WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM conference WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM guest_lectures WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM extension_activities WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM industrial_visits WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM evs WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM departmental_activities WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM projects_services WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM honours WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM exams WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM books_published WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM chapters_contributed WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM conference_proceeding WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM paper_presentation WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM journal_publications WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM fconference WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM resource_person WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM financial_support WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM development_programmes WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM online_courses WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM e_content WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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

router.get('/period/students/:prd/:dprt',async(req,res) =>{
    console.log(req.params.prd)

    let placements,publications,paper_presentation,conference,competition,training,projectwork,exams,online_courses,achievements
        
    try{
            pool.query(
                `SELECT * FROM placements WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows != ''){
                        placements = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }
                }
            );
    
            pool.query(
                `SELECT * FROM s_publications WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
                (err, result) => {
                    if(result.rows != ''){
                        publications = result.rows 
                    }          
                    else{
                        console.log("no values")
                    }           
                }
            );
    
            pool.query(
                `SELECT * FROM s_paper_presentation WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_conference WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_competition WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_training WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_projectwork WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_exams WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_onlinecourses WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM s_achievements WHERE date between ${req.params.prd} AND department = '${req.params.dprt}'`,
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
                `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    return res.send(
                        {
                            user : result.rows,
                            placements : placements,
                            publications : publications,
                            paper_presentation : paper_presentation,
                            conference : conference,
                            competition : competition,
                            training : training,
                            projectwork : projectwork,
                            exams : exams,
                            online_courses : online_courses,
                            achievements : achievements
                        }
                    )            
                }
            );

    }
    catch(err){
        console.log(err)
    }
})

router.get('/super_admin/overall/staffs/:table', async(req,res) => {
    let datas
    let length
        try{
            pool.query(
                `SELECT * FROM ${req.params.table}`,
                (err, result) => {
                    if(result.rows!=''){
                        datas = result.rows
                    }
                }
            );

            pool.query(
                `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    return res.send(
                        {
                            user : result.rows,
                            table : datas
                        }
                    )            
                }
            );
        }
        catch(er){
            console.log(er)
        }
})

router.get('/period/overall/staffs/:prd/:table',async(req,res) =>{
    console.log(req.params.table)
    let datas        
    try{
            pool.query(
                `SELECT * FROM ${req.params.table} WHERE date between ${req.params.prd}`,
                (err, result) => {
                    if(result.rows != ''){
                        datas = result.rows 
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
                            table : datas,
                        }
                    )            
                }
            );

    }
    catch(err){
        console.log(err)
    }
})

router.get('/super_admin/overall/students/:table', async(req,res) => {
    let datas
    let length
        try{
            pool.query(
                `SELECT * FROM ${req.params.table}`,
                (err, result) => {
                    if(result.rows!=''){
                        datas = result.rows
                    }
                }
            );

            pool.query(
                `SELECT * FROM users WHERE user_id = ${req.cookies.user_id}`,
                (err, result) => {
                    return res.send(
                        {
                            user : result.rows,
                            table : datas
                        }
                    )            
                }
            );
        }
        catch(er){
            console.log(er)
        }
})

router.get('/period/overall/students/:prd/:table',async(req,res) =>{
    console.log(req.params.table)
    let datas        
    try{
            pool.query(
                `SELECT * FROM ${req.params.table} WHERE date between ${req.params.prd}`,
                (err, result) => {
                    if(result.rows != ''){
                        datas = result.rows 
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
                            table : datas,
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
    let vtoken,verifyToken
    if(req.cookies.jwtoken && req.cookies.user_id ){
        vtoken = req.cookies.jwtoken
        verifyToken = jwt.verify(vtoken,process.env.SECRET_KEY)
        console.log(`${verifyToken}`)
    }            
    else{
        console.log('No')
        return res.status(422).send({error: "No Token"})
    }     

    if(verifyToken){
        try{                    
            pool.query(
                `SELECT * FROM users WHERE user_id = '${req.cookies.user_id}'`,
                (err, result) => {
                    if(result.rows != ''){
                        console.log(result.rows)
                        return res.send(
                            {
                                user : result.rows
                            }
                        )            
                    }
                }
            );
        }
        catch(er){
            console.log(er)
        }
    }
    else{
        console.log('No')
        return res.status(422).send({error: "Token Expires"})
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
        var {name,password,cpassword,ppassword,hashpassword,department,email} = req.body
        if(!name && !password && !cpassword  && !department){
            return res.status(400).json({error: "Fill the data"})
        }

        else if(name && !password){
            if(req.cookies.email === email){
                console.log(email)
                pool.query(
                    `UPDATE users SET name = $1 WHERE user_id = $2`,[name,req.params.id],
                    (err, result) => {
                        res.send(result.rows)
                    }
                );
            }
            else{
                pool.query(
                    `UPDATE users SET name = $1,email = $2 WHERE user_id = $3`,[name,email,req.params.id],
                    (err, result) => {
                        res.send(result.rows)
                    }
                );
        
                res.cookie("email",email,{
                    httpOnly: true
                })
            }
        }

        else if(password && cpassword && ppassword && hashpassword && !name){
            const ps = await bcrypt.hash(password,10)

            let pscmp = await bcrypt.compare(ppassword,hashpassword)
            console.log(pscmp)
            if(pscmp){
                pool.query(
                    `UPDATE users SET password = $1 WHERE user_id = $2`,[ps,req.params.id],
                    (err, result) => {
                        res.send(result.rows)
                    }
                );
            }
            else{
                res.status(422).send({error : "Password was wrong"})
            }
        }
    }
    catch(err){
        console.log(err)
    }
})

router.post('/forms/research/research_projects',upload.single('image'),async(req,res) => {
    try{
        if(req.file){
            console.log(req.file,req.body)
            console.log(req.file.filename)
            pool.query(
                `INSERT INTO research_projects (n,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,file,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.title,req.body.no,req.body.amount_sanctioned,req.body.fileno,req.body.amount_received,req.body.date_sanctioned,req.body.funding_agency,req.body.date,req.file.filename,req.body.department],
                (err, result) => {              
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            )
        }
        else{
            pool.query(
                `INSERT INTO research_projects (n,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.title,req.body.no,req.body.amount_sanctioned,req.body.fileno,req.body.amount_received,req.body.date_sanctioned,req.body.funding_agency,req.body.date,req.body.department],
                (err, result) => {              
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            )
        }
    }catch(err){
        console.log(err+'22')
    }
})

router.put('/forms/research/research_projects/edit',upload.single('image'), async(req,res) => {
    console.log(req.file,'1608')
    try{
        if(req.file){
            pool.query(
                `UPDATE research_projects SET title=$1, no=$2, amount_sanctioned=$3, fileno=$4, amount_received=$5, date_sanctioned=$6, funding_agency=$7, date=$8,file=$9,n=$10 WHERE id=$11`,[req.body.title,req.body.no,req.body.amount_sanctioned,req.body.fileno,req.body.amount_received,req.body.date_sanctioned,req.body.funding_agency,req.body.date,req.file.filename,req.body.n,req.body.id],
                function (err, result) {
                    if(result){
                        res.send({sp : "Saved"})}
                        console.log(err)
                }
            );
        }
        else{
            console.log(req.body.date,req.body.id)
            pool.query(
                `UPDATE research_projects SET title=$1, no=$2, amount_sanctioned=$3, fileno=$4, amount_received=$5, date_sanctioned=$6, funding_agency=$7, date=$8, n=$9 WHERE id=$10`,[req.body.title,req.body.no,req.body.amount_sanctioned,req.body.fileno,req.body.amount_received,req.body.date_sanctioned,req.body.funding_agency,req.body.date,req.body.n,req.body.id],
                function (err, result) {
                    if(result){
                        res.send({sp : "Saved"})}
                        console.log(err)
                }
            );
        }

    }catch(err){
        console.log(err)
    }
})

router.get('/forms/:table/edit/:id', async(req,res) => {
    const {id} = req.params.id
    try{
        pool.query(
            `SELECT * FROM ${req.params.table} WHERE id = ${req.params.id}`,
            function (err, result) {
                if(result){
                    res.json(result.rows)
                }
                console.log(err)
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/:table/delete/:id', async(req,res) => {
    console.log(req.params.id)
    try{
        pool.query(
            `DELETE FROM ${req.params.table} WHERE id = ${req.params.id} `,
            function (err, result) {
                console.log("Deleted")
                return res.status(201).json({message: "Deleted"})
            }
        );

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/patents',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
            `INSERT INTO patents (n,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.title,req.body.field,req.body.fileno,req.body.date_awarded_patent,req.body.royalty_received,req.body.providing_agency,req.body.country,req.body.date,req.body.department,req.file.filename],
            (err, result) => {          
                if(result){
                res.send({sp : "Saved"})}
                console.log(err)
            }
            );
        }
        else{
            pool.query(
                `INSERT INTO patents (n,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.title,req.body.field,req.body.fileno,req.body.date_awarded_patent,req.body.royalty_received,req.body.providing_agency,req.body.country,req.body.date,req.body.department],
                (err, result) => {          
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
                );
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/patents/edit',upload.single('image'), async(req,res) => {
    try{
        console.log(req.file)
        if(req.file){
            pool.query(
                `UPDATE patents SET title=$1,field=$2,fileno=$3,date_awarded_patent=$4,royalty_received=$5,providing_agency=$6,country=$7,date=$8,file=$9 WHERE id=$10`,[req.body.title,req.body.field,req.body.fileno,req.body.date_awarded_patent,req.body.royalty_received,req.body.providing_agency,req.body.country,req.body.date,req.file.filename,req.body.id],
                function (err, result) {         
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }   
            );
        }
        else{
            console.log(req.body)
            pool.query(
                `UPDATE patents SET title=$1,field=$2,fileno=$3,date_awarded_patent=$4,royalty_received=$5,providing_agency=$6,country=$7,date=$8 WHERE id=$9`,[req.body.title,req.body.field,req.body.fileno,req.body.date_awarded_patent,req.body.royalty_received,req.body.providing_agency,req.body.country,req.body.date,req.body.id],
                function (err, result) {         
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }   
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/awards_for_innovation',upload.single('image'), async(req,res) => {
    try{
        console.log(req.body,req.file)
        if(req.file){
            pool.query(
                `INSERT INTO awards_for_innovation (n,awardee_name,designation,award_category,title,awarding_agency,venue,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.awardee_name,req.body.designation,req.body.award_category,req.body.title,req.body.awarding_agency,req.body.venue,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {      
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO awards_for_innovation (n,awardee_name,designation,award_category,title,awarding_agency,venue,level,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.awardee_name,req.body.designation,req.body.award_category,req.body.title,req.body.awarding_agency,req.body.venue,req.body.level,req.body.date,req.body.department],
                (err, result) => {      
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/awards_for_innovation/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE awards_for_innovation SET awardee_name=$1,designation=$2,award_category=$3,title=$4,awarding_agency=$5,venue=$6,level=$7,date=$8,file=$9 WHERE id=$10`,[req.body.awardee_name,req.body.designation,req.body.award_category,req.body.title,req.body.awarding_agency,req.body.venue,req.body.level,req.body.date,req.file.filename,req.body.id],
                function (err, result) {    
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE awards_for_innovation SET awardee_name=$1,designation=$2,award_category=$3,title=$4,awarding_agency=$5,venue=$6,level=$7,date=$8 WHERE id=$9`,[req.body.awardee_name,req.body.designation,req.body.award_category,req.body.title,req.body.awarding_agency,req.body.venue,req.body.level,req.body.date,req.body.id],
                function (err, result) {    
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/deg',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO degree (n,deg,guide_name,title,external,venue,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.deg,req.body.guide_name,req.body.title,req.body.external,req.body.venue,req.body.date,req.body.department,req.file.filename],
                (err, result) => {   
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO degree (n,deg,guide_name,title,external,venue,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.deg,req.body.guide_name,req.body.title,req.body.external,req.body.venue,req.body.date,req.body.department],
                (err, result) => {   
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/deg/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE degree SET deg=$1,guide_name=$2,title=$3,external=$4,venue=$5,date=$6,file=$7 WHERE id=$8`,[req.body.deg,req.body.guide_name,req.body.title,req.body.external,req.body.venue,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE degree SET deg=$1,guide_name=$2,title=$3,external=$4,venue=$5,date=$6 WHERE id=$7`,[req.body.deg,req.body.guide_name,req.body.title,req.body.external,req.body.venue,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/fellowship',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO fellowship (n,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.fellowship,req.body.date_sanctioned,req.body.funding_agency,req.body.sanctioned_amount,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO fellowship (n,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.fellowship,req.body.date_sanctioned,req.body.funding_agency,req.body.sanctioned_amount,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/fellowship/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE fellowship SET fellowship=$1,date_sanctioned=$2,funding_agency=$3,sanctioned_amount=$4,date=$5, file=$6 WHERE id=$7`,[req.body.fellowship,req.body.date_sanctioned,req.body.funding_agency,req.body.sanctioned_amount,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE fellowship SET fellowship=$1,date_sanctioned=$2,funding_agency=$3,sanctioned_amount=$4,date=$5 WHERE id=$6`,[req.body.fellowship,req.body.date_sanctioned,req.body.funding_agency,req.body.sanctioned_amount,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/collaborative_activities',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO collab_activ (n,activity,participant,financial_support,period,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.activity,req.body.participant,req.body.financial_support,req.body.period,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            console.log(req.body)
            pool.query(
                `INSERT INTO collab_activ (activity,n,participant,financial_support,period,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.activity,req.body.n,req.body.participant,req.body.financial_support,req.body.period,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/collaborative_activities/edit',upload.single('image'), async(req,res) => {
    console.log(req.body)
    try{
        if(req.file){
            pool.query(
                `UPDATE collab_activ SET activity=$1,participant=$2,financial_support=$3,period=$4,date=$5,file=$6 WHERE id=$7`,[req.body.activity,req.body.participant,req.body.financial_support,req.body.period,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE collab_activ SET activity=$1,participant=$2,financial_support=$3,period=$4,date=$5 WHERE id=$6`,[req.body.activity,req.body.participant,req.body.financial_support,req.body.period,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/linkages',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO linkages (n,title,partnering_agency,period,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.title,req.body.partnering_agency,req.body.period,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO linkages (n,title,partnering_agency,period,date,department) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.title,req.body.partnering_agency,req.body.period,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/linkages/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE linkages SET title=$1,partnering_agency=$2,period=$3,date=$4,file=$5 WHERE id=$6`,[req.body.title,req.body.partnering_agency,req.body.period,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE linkages SET title=$1,partnering_agency=$2,period=$3,date=$4 WHERE id=$5`,[req.body.title,req.body.partnering_agency,req.body.period,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/mou',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO mou (n,organization,date_signed,period,participants,purpose,total,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.organization,req.body.date_signed,req.body.period,req.body.participants,req.body.purpose,req.body.total,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO mou (n,organization,date_signed,period,participants,purpose,total,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.organization,req.body.date_signed,req.body.period,req.body.participants,req.body.purpose,req.body.total,req.body.date],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/mou/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE mou SET organization=$1,date_signed=$2,period=$3,participants=$4,purpose=$5,total=$6,date=$7,department=$8,file=$9 WHERE id=$10`,[req.body.organization,req.body.date_signed,req.body.period,req.body.participants,req.body.purpose,req.body.total,req.body.date,req.body.department,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{            
            pool.query(
                `UPDATE mou SET organization=$1,date_signed=$2,period=$3,participants=$4,purpose=$5,total=$6,date=$7 WHERE id=$8`,[req.body.organization,req.body.date_signed,req.body.period,req.body.participants,req.body.purpose,req.body.total,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/conference',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO conference (n,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[req.body.n,req.body.con_sem,req.body.title,req.body.sponsoring_agency,req.body.resource_person,req.body.venue,req.body.objective,req.body.outcome,req.body.level,req.body.total,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO conference (n,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.con_sem,req.body.title,req.body.sponsoring_agency,req.body.resource_person,req.body.venue,req.body.objective,req.body.outcome,req.body.level,req.body.total,req.body.date],
                (err, result) => {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/conference/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE conference SET con_sem=$1,title=$2,sponsoring_agency=$3,resource_person=$4,venue=$5,objective=$6,outcome=$7,level=$8,total=$9,date=$10,file=$11 WHERE id=$12`,[req.body.con_sem,req.body.title,req.body.sponsoring_agency,req.body.resource_person,req.body.venue,req.body.objective,req.body.outcome,req.body.level,req.body.total,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );  
        }      
        else{
            pool.query(
                `UPDATE conference SET con_sem=$1,title=$2,sponsoring_agency=$3,resource_person=$4,venue=$5,objective=$6,outcome=$7,level=$8,total=$9,date=$10 WHERE id=$11`,[req.body.con_sem,req.body.title,req.body.sponsoring_agency,req.body.resource_person,req.body.venue,req.body.objective,req.body.outcome,req.body.level,req.body.total,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.send({sp : "Saved"})}
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/guest_lectures',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO guest_lectures (n,resource_person,designation,topic,venue,objective,outcome,total,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.resource_person,req.body.designation,req.body.topic,req.body.venue,req.body.objective,req.body.outcome,req.body.total,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO guest_lectures (n,resource_person,designation,topic,venue,objective,outcome,total,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.resource_person,req.body.designation,req.body.topic,req.body.venue,req.body.objective,req.body.outcome,req.body.total,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/guest_lectures/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE guest_lectures SET resource_person=$1,designation=$2,topic=$3,date=$4,objective=$5,outcome=$6,total=$7,file=$8,venue=$9 WHERE id=$10`,[req.body.resource_person,req.body.designation,req.body.topic,req.body.date,req.body.objective,req.body.outcome,req.body.total,req.file.filename,req.body.venue,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }      
        else{
            pool.query(
                `UPDATE guest_lectures SET resource_person=$1,designation=$2,topic=$3,date=$4,objective=$5,outcome=$6,total=$7,venue=$8 WHERE id=$9`,[req.body.resource_person,req.body.designation,req.body.topic,req.body.date,req.body.objective,req.body.outcome,req.body.total,req.body.venue,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        } 
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/extension_activities',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO extension_activities(n,activities,collaborations,venue,total,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.activities,req.body.collaborations,req.body.venue,req.body.total,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO extension_activities(n,activities,collaborations,venue,total,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.activities,req.body.collaborations,req.body.venue,req.body.total,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/extension_activities/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE extension_activities SET activities=$1,collaborations=$2,venue=$3,total=$4,date=$5,file=$6 WHERE id=$7`,[req.body.activities,req.body.collaborations,req.body.venue,req.body.total,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }    
        else{
            pool.query(
                `UPDATE extension_activities SET activities=$1,collaborations=$2,venue=$3,total=$4,date=$5 WHERE id=$6`,[req.body.activities,req.body.collaborations,req.body.venue,req.body.total,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/industrial_visits',upload.single('image'), async(req,res) => {
    try{
        console.log(req.body.date)
        if(req.file){
            pool.query(
                `INSERT INTO industrial_visits(n,classes,date,address,total,outcome,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.classes,req.body.date,req.body.address,req.body.total,req.body.outcome,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );            
        }
        else{
            pool.query(
                `INSERT INTO industrial_visits(n,classes,date,address,total,outcome,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.classes,req.body.date,req.body.address,req.body.total,req.body.outcome,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/industrial_visits/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE industrial_visits SET classes=$1,date=$2,address=$3,total=$4,outcome=$5,file=$6 WHERE id=$7`,[req.body.classes,req.body.date,req.body.address,req.body.total,req.body.outcome,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );  
        }   
        else{
            pool.query(
                `UPDATE industrial_visits SET classes=$1,date=$2,address=$3,total=$4,outcome=$5 WHERE id=$6`,[req.body.classes,req.body.date,req.body.address,req.body.total,req.body.outcome,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/evs',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO evs(n,date,place,total,activity,department,file) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.date,req.body.place,req.body.total,req.body.activity,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO evs(n,date,place,total,activity,department) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.date,req.body.place,req.body.total,req.body.activity,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/evs/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE evs SET date=$1,place=$2,total=$3,activity=$4,file=$5 WHERE id=$6`,[req.body.date,req.body.place,req.body.total,req.body.activity,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        } 
        else{
            pool.query(
                `UPDATE evs SET date=$1,place=$2,total=$3,activity=$4 WHERE id=$5`,[req.body.date,req.body.place,req.body.total,req.body.activity,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/departmental_activities',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO departmental_activities(n,activity,guest,topic,total,venue,filled,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.activity,req.body.guest,req.body.topic,req.body.total,req.body.venue,req.body.filled,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{            
            pool.query(
                `INSERT INTO departmental_activities(n,activity,guest,topic,total,venue,filled,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.activity,req.body.guest,req.body.topic,req.body.total,req.body.venue,req.body.filled,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/departmental_activities/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE departmental_activities SET activity=$1,guest=$2,topic=$3,total=$4,venue=$5,date=$6,file=$7 WHERE id=$8`,[req.body.activity,req.body.guest,req.body.topic,req.body.total,req.body.venue,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
        else{
            pool.query(
                `UPDATE departmental_activities SET activity=$1,guest=$2,topic=$3,total=$4,venue=$5,date=$6 WHERE id=$7`,[req.body.activity,req.body.guest,req.body.topic,req.body.total,req.body.venue,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/consultancy/projects_services',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO projects_services(n,title,no,revenue_generated,date_sanction,sponsor,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.title,req.body.no,req.body.revenue_generated,req.body.date_sanction,req.body.sponsor,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{            
            pool.query(
                `INSERT INTO projects_services(n,title,no,revenue_generated,date_sanction,sponsor,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.title,req.body.no,req.body.revenue_generated,req.body.date_sanction,req.body.sponsor,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/consultancy/projects_services/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE projects_services SET title=$1,no=$2,revenue_generated=$3,date_sanction=$4,sponsor=$5,date=$6,file=$7 WHERE id=$8`,[req.body.title,req.body.no,req.body.revenue_generated,req.body.date_sanction,req.body.sponsor,req.body.date,req.body.id,req.file.filename],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        } 
        else{
            pool.query(
                `UPDATE projects_services SET title=$1,no=$2,revenue_generated=$3,date_sanction=$4,sponsor=$5,date=$6 WHERE id=$7`,[req.body.title,req.body.no,req.body.revenue_generated,req.body.date_sanction,req.body.sponsor,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/honours',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO honours(n,award_honour,details,venue,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.award_honour,req.body.details,req.body.venue,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO honours(n,award_honour,details,venue,level,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.award_honour,req.body.details,req.body.venue,req.body.level,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/honours/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE honours SET award_honour=$1,details=$2,venue=$3,level=$4,date=$5,file=$6 WHERE id=$7`,[req.body.award_honour,req.body.details,req.body.venue,req.body.level,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE honours SET award_honour=$1,details=$2,venue=$3,level=$4,date=$5 WHERE id=$6`,[req.body.award_honour,req.body.details,req.body.venue,req.body.level,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        } 
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/exams',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO exams(n,exam,exam_rollno,date,department,file) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.exam,req.body.exam_rollno,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO exams(n,exam,exam_rollno,date,department) VALUES($1,$2,$3,$4,$5)`,[req.body.n,req.body.exam,req.body.exam_rollno,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/exams/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE exams SET exam=$1,exam_rollno=$2,date=$3,file=$4 WHERE id=$5`,[req.body.exam,req.body.exam_rollno,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE exams SET exam=$1,exam_rollno=$2,date=$3 WHERE id=$4`,[req.body.exam,req.body.exam_rollno,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }         
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/books_published',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO books_published(n,name,publisher,level,isbn_no,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.name,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO books_published(n,name,publisher,level,isbn_no,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.name,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/books_published/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE books_published SET name=$1,publisher=$2,level=$3,isbn_no=$4,date=$5,file=$6 WHERE id=$7`,[req.body.name,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
        else{
            pool.query(
                `UPDATE books_published SET name=$1,publisher=$2,level=$3,isbn_no=$4,date=$5 WHERE id=$6`,[req.body.name,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/chapters_contributed',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO chapters_contributed(n,title,chapter,editor,publisher,level,isbn_no,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.title,req.body.chapter,req.body.editor,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO chapters_contributed(n,title,chapter,editor,publisher,level,isbn_no,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.title,req.body.chapter,req.body.editor,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/chapters_contributed/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE chapters_contributed SET title=$1,chapter=$2,editor=$3,publisher=$4,level=$5,isbn_no=$6,date=$7,file=$8 WHERE id=$9`,[req.body.title,req.body.chapter,req.body.editor,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
        else{
            pool.query(
                `UPDATE chapters_contributed SET title=$1,chapter=$2,editor=$3,publisher=$4,level=$5,isbn_no=$6,date=$7 WHERE id=$8`,[req.body.title,req.body.chapter,req.body.editor,req.body.publisher,req.body.level,req.body.isbn_no,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/conference_proceeding',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO conference_proceeding(n,con,publication,level,isbn_no,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.con,req.body.publication,req.body.level,req.body.isbn_no,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO conference_proceeding(n,con,publication,level,isbn_no,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.con,req.body.publication,req.body.level,req.body.isbn_no,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference_proceeding/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE conference_proceeding SET con=$1,publication=$2,level=$3,isbn_no=$4,date=$5,file=$6 WHERE id=$7`,[req.body.con,req.body.publication,req.body.level,req.body.isbn_no,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );    
        }
        else{
            pool.query(
                `UPDATE conference_proceeding SET con=$1,publication=$2,level=$3,isbn_no=$4,date=$5 WHERE id=$6`,[req.body.con,req.body.publication,req.body.level,req.body.isbn_no,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/paper_presentation',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO paper_presentation(n,con,title,financial_support,venue,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.con,req.body.title,req.body.financial_support,req.body.venue,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO paper_presentation(n,con,title,financial_support,venue,level,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.con,req.body.title,req.body.financial_support,req.body.venue,req.body.level,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/paper_presentation/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE paper_presentation SET con=$1,title=$2,financial_support=$3,venue=$4,level=$5,date=$6,file=$7 WHERE id=$8`,[req.body.con,req.body.title,req.body.financial_support,req.body.venue,req.body.level,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
        else{
            pool.query(
                `UPDATE paper_presentation SET con=$1,title=$2,financial_support=$3,venue=$4,level=$5,date=$6 WHERE id=$7`,[req.body.con,req.body.title,req.body.financial_support,req.body.venue,req.body.level,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/journal_publications',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO journal_publications(n,title,jou,issn_no,volume,sci,impact,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.title,req.body.jou,req.body.issn_no,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO journal_publications(n,title,jou,issn_no,volume,sci,impact,level,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.title,req.body.jou,req.body.issn_no,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/journal_publications/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE journal_publications SET title=$1,jou=$2,issn_no=$3,volume=$4,sci=$5,impact=$6,level=$7,date=$8,file=$9 WHERE id=$10`,[req.body.title,req.body.jou,req.body.issn_no,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE journal_publications SET title=$1,jou=$2,issn_no=$3,volume=$4,sci=$5,impact=$6,level=$7,date=$8 WHERE id=$9`,[req.body.title,req.body.jou,req.body.issn_no,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/conference',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO fconference(n,con,title,venue,level,financial_support,programme_outcome,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.con,req.body.title,req.body.venue,req.body.level,req.body.financial_support,req.body.programme_outcome,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO fconference(n,con,title,venue,level,financial_support,programme_outcome,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.con,req.body.title,req.body.venue,req.body.level,req.body.financial_support,req.body.programme_outcome,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE fconference SET con=$1,title=$2,venue=$3,level=$4,financial_support=$5,programme_outcome=$6,date=$7,file=$8 WHERE id=$9`,[req.body.con,req.body.title,req.body.venue,req.body.level,req.body.financial_support,req.body.programme_outcome,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE fconference SET con=$1,title=$2,venue=$3,level=$4,financial_support=$5,programme_outcome=$6,date=$7 WHERE id=$8`,[req.body.con,req.body.title,req.body.venue,req.body.level,req.body.financial_support,req.body.programme_outcome,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/resource_person',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO resource_person(n,sem,topic,event,venue,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.sem,req.body.topic,req.body.event,req.body.venue,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
        else{
            pool.query(
                `INSERT INTO resource_person(n,sem,topic,event,venue,leveldate,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.sem,req.body.topic,req.body.event,req.body.venue,req.body.level,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/resource_person/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE resource_person SET sem=$1,topic=$2,event=$3,venue=$4,level=$5,date=$6,file=$7 WHERE id=$8`,[req.body.sem,req.body.topic,req.body.event,req.body.venue,req.body.level,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE resource_person SET sem=$1,topic=$2,event=$3,venue=$4,level=$5,date=$6 WHERE id=$7`,[req.body.sem,req.body.topic,req.body.event,req.body.venue,req.body.level,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/financial_support',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO financial_support(n,f,amount_support,date,department,file) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.f,req.body.amount_support,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO financial_support(n,f,amount_support,date,department) VALUES($1,$2,$3,$4,$5)`,[req.body.n,req.body.f,req.body.amount_support,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/financial_support/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE financial_support SET f=$1,amount_support=$2,date=$3,file=$4 WHERE id=$5`,[req.body.f,req.body.amount_support,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE financial_support SET f=$1,amount_support=$2,date=$3 WHERE id=$4`,[req.body.f,req.body.amount_support,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/development_programmes',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO development_programmes(n,training,title,venue,financial_support,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.training,req.body.title,req.body.venue,req.body.financial_support,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO development_programmes(n,training,title,venue,financial_support,level,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.training,req.body.title,req.body.venue,req.body.financial_support,req.body.level,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/development_programmes/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE development_programmes SET training=$1,title=$2,venue=$3,financial_support=$4,level=$5,date=$6,file=$7 WHERE id=$8`,[req.body.training,req.body.title,req.body.venue,req.body.financial_support,req.body.level,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE development_programmes SET training=$1,title=$2,venue=$3,financial_support=$4,level=$5,date=$6 WHERE id=$7`,[req.body.training,req.body.title,req.body.venue,req.body.financial_support,req.body.level,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/online_courses',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO online_courses(n,training,title,duration,date,financial_support,level,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.training,req.body.title,req.body.duration,req.body.date,req.body.financial_support,req.body.level,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO online_courses(n,training,title,duration,date,financial_support,level,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.training,req.body.title,req.body.duration,req.body.date,req.body.financial_support,req.body.level,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/online_courses/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE online_courses SET training=$1,title=$2,duration=$3,date=$4,financial_support=$5,level=$6,file=$7 WHERE id=$8`,[req.body.training,req.body.title,req.body.duration,req.body.date,req.body.financial_support,req.body.level,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE online_courses SET training=$1,title=$2,duration=$3,date=$4,financial_support=$5,level=$6 WHERE id=$7`,[req.body.training,req.body.title,req.body.duration,req.body.date,req.body.financial_support,req.body.level,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/e_content',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO e_content(n,module,platform,date,department,file) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.module,req.body.platform,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO e_content(n,module,platform,date,department) VALUES($1,$2,$3,$4,$5)`,[req.body.n,req.body.module,req.body.platform,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/e_content/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE e_content SET module=$1,platform=$2,date=$3,file=$4 WHERE id=$5`,[req.body.module,req.body.platform,req.body.date,req.file.filename,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE e_content SET module=$1,platform=$2,date=$3 WHERE id=$4`,[req.body.module,req.body.platform,req.body.date,req.body.id],
                function (err, result) {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

// Stundets

router.post('/forms/student/placements',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO placements(n,roll_no,company_placed,annual_package,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.roll_no,req.body.company_placed,req.body.annual_package,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );        
        }
        else{
            pool.query(
                `INSERT INTO placements(n,roll_no,company_placed,annual_package,date,department) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.roll_no,req.body.company_placed,req.body.annual_package,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            ); 
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/placements/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE placements SET n=$1,roll_no=$2,company_placed=$3,annual_package=$4,date=$5,file=$6 WHERE id=$7`,[req.body.n,req.body.roll_no,req.body.company_placed,req.body.annual_package,req.body.date,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE placements SET n=$1,roll_no=$2,company_placed=$3,annual_package=$4,date=$5 WHERE id=$6`,[req.body.n,req.body.roll_no,req.body.company_placed,req.body.annual_package,req.body.date,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_publications',upload.single('image'), async(req,res) => {
    try{
        console.log(req.body.njourrnal)
        if(req.file){
            pool.query(
                `INSERT INTO s_publications(n,roll_no,title,n_journal,issn,volume,sci,impact,level,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[req.body.n,req.body.roll_no,req.body.title,req.body.njournal,req.body.issn,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_publications(n,roll_no,title,n_journal,issn,volume,sci,impact,level,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.roll_no,req.body.title,req.body.njournal,req.body.issn,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_publications/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_publications set n=$1,roll_no=$2,title=$3,n_journal=$4,issn=$5,volume=$6,sci=$7,impact=$8,level=$9,date=$10,file=$11 WHERE id=$12`,[req.body.n,req.body.roll_no,req.body.title,req.body.njournal,req.body.issn,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_publications set n=$1,roll_no=$2,title=$3,n_journal=$4,issn=$5,volume=$6,sci=$7,impact=$8,level=$9,date=$10  WHERE id=$11`,[req.body.n,req.body.roll_no,req.body.title,req.body.njournal,req.body.issn,req.body.volume,req.body.sci,req.body.impact,req.body.level,req.body.date,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_paper_presentation',upload.single('image'), async(req,res) => {
    try{
        console.log(req.body.njourrnal)
        if(req.file){
            pool.query(
                `INSERT INTO s_paper_presentation(n,roll_no,con,title,financial_support,date,venue,level,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.roll_no,req.body.con,req.body.title,req.body.financial_support,req.body.date,req.body.venue,req.body.level,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_paper_presentation(n,roll_no,con,title,financial_support,date,venue,level,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.roll_no,req.body.con,req.body.title,req.body.financial_support,req.body.date,req.body.venue,req.body.level,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_paper_presentation/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_paper_presentation set n=$1,roll_no=$2,con=$3,title=$4,financial_support=$5,date=$6,venue=$7,level=$8,file=$9 WHERE id=$10`,[req.body.n,req.body.roll_no,req.body.con,req.body.title,req.body.financial_support,req.body.date,req.body.venue,req.body.level,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_paper_presentation set n=$1,roll_no=$2,con=$3,title=$4,financial_support=$5,date=$6,venue=$7,level=$8 WHERE id=$9`,[req.body.n,req.body.roll_no,req.body.con,req.body.title,req.body.financial_support,req.body.date,req.body.venue,req.body.level,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_conference',upload.single('image'), async(req,res) => {
    try{
        console.log(req.body.njourrnal)
        if(req.file){
            pool.query(
                `INSERT INTO s_conference(n,roll_no,con,n_con,sponsoring_agency,poster,award,date,venue,level,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n,req.body.roll_no,req.body.con,req.body.n_con,req.body.sponsoring_agency,req.body.poster,req.body.award,req.body.date,req.body.venue,req.body.level,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_conference(n,roll_no,con,n_con,sponsoring_agency,poster,award,date,venue,level,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.roll_no,req.body.con,req.body.n_con,req.body.sponsoring_agency,req.body.poster,req.body.award,req.body.date,req.body.venue,req.body.level,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_conference/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_conference set n=$1,roll_no=$2,con=$3,title=$4,financial_support=$5,date=$6,venue=$7,level=$8,file=$9 WHERE id=$10`,[req.body.n,req.body.roll_no,req.body.con,req.body.title,req.body.financial_support,req.body.date,req.body.venue,req.body.level,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_conference set n=$1,roll_no=$2,con=$3,title=$4,financial_support=$5,date=$6,venue=$7,level=$8 WHERE id=$9`,[req.body.n,req.body.roll_no,req.body.con,req.body.title,req.body.financial_support,req.body.date,req.body.venue,req.body.level,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_competition',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO s_competition(n_event,n,roll_no,con,n_con,award,sponsoring_agency,date,venue,level,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[req.body.n_event,req.body.n,req.body.roll_no,req.body.con,req.body.n_con,req.body.award,req.body.sponsoring_agency,req.body.date,req.body.venue,req.body.level,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_competition(n_event,n,roll_no,con,n_con,award,sponsoring_agency,date,venue,level,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[req.body.n_event,req.body.n,req.body.roll_no,req.body.con,req.body.n_con,req.body.award,req.body.sponsoring_agency,req.body.date,req.body.venue,req.body.level,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_competition/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_competition set n=$1,roll_no=$2,con=$3,n_con=$4,award=$5,sponsoring_agency=$6,date=$7,venue=$8,level=$9,file=$10,n_event=$11 WHERE id=$12`,[req.body.n,req.body.roll_no,req.body.con,req.body.n_con,req.body.award,req.body.sponsoring_agency,req.body.date,req.body.venue,req.body.level,req.file.filename,req.body.n_event,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_competition set n=$1,roll_no=$2,con=$3,n_con=$4,award=$5,sponsoring_agency=$6,date=$7,venue=$8,level=$9,n_event=$10 WHERE id=$11`,[req.body.n,req.body.roll_no,req.body.con,req.body.n_con,req.body.award,req.body.sponsoring_agency,req.body.date,req.body.venue,req.body.level,req.body.n_event,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_training',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO s_training(n,roll_no,training,company,period,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.roll_no,req.body.training,req.body.company,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_training(n,roll_no,training,company,period,date,department) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.roll_no,req.body.training,req.body.company,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_training/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_training set n=$1,roll_no=$2,training=$3,company=$4,period=$5,date=$6,file=$7 WHERE id=$8`,[req.body.n,req.body.roll_no,req.body.training,req.body.company,req.body.period,req.body.date,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_training set n=$1,roll_no=$2,training=$3,company=$4,period=$5,date=$6 WHERE id=$7`,[req.body.n,req.body.roll_no,req.body.training,req.body.company,req.body.period,req.body.date,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_projectwork',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO s_projectwork(n,roll_no,guide,company,certificate,period,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.roll_no,req.body.guide,req.body.company,req.body.certificate,req.body.period,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_projectwork(n,roll_no,guide,company,certificate,period,date,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.roll_no,req.body.guide,req.body.company,req.body.certificate,req.body.period,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_projectwork/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_projectwork set n=$1,roll_no=$2,guide=$3,company=$4,certificate=$5,period=$6,date=$7,file=$8 WHERE id=$9`,[req.body.n,req.body.roll_no,req.body.guide,req.body.company,req.body.certificate,req.body.period,req.body.date,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_projectwork set n=$1,roll_no=$2,guide=$3,company=$4,certificate=$5,period=$6,date=$7 WHERE id=$8`,[req.body.n,req.body.roll_no,req.body.guide,req.body.company,req.body.certificate,req.body.period,req.body.date,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_exams',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO s_exams(n,roll_no,exam_qualified,e_roll,date,department,file) VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.body.n,req.body.roll_no,req.body.exam_qualified,req.body.e_roll,req.body.date,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_exams(n,roll_no,exam_qualified,e_roll,date,department) VALUES($1,$2,$3,$4,$5,$6)`,[req.body.n,req.body.roll_no,req.body.exam_qualified,req.body.e_roll,req.body.date,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_exams/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_exams set n=$1,roll_no=$2,exam_qualified=$3,e_roll=$4,date=$5,file=$6 WHERE id=$7`,[req.body.n,req.body.roll_no,req.body.exam_qualified,req.body.e_roll,req.body.date,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_exams set n=$1,roll_no=$2,exam_qualified=$3,e_roll=$4,date=$5 WHERE id=$6`,[req.body.n,req.body.roll_no,req.body.exam_qualified,req.body.e_roll,req.body.date,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_onlinecourses',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO s_onlinecourses(n,roll_no,portal,n_course,duration,financial_support,date,level,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[req.body.n,req.body.roll_no,req.body.portal,req.body.n_course,req.body.duration,req.body.financial_support,req.body.date,req.body.level,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_onlinecourses(n,roll_no,portal,n_course,duration,financial_support,date,level,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.roll_no,req.body.portal,req.body.n_course,req.body.duration,req.body.financial_support,req.body.date,req.body.level,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_onlinecourses/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_onlinecourses set n=$1,roll_no=$2,portal=$3,n_course=$4,duration=$5,financial_support=$6,date=$7,file=$8 WHERE id=$9`,[req.body.n,req.body.roll_no,req.body.portal,req.body.n_course,req.body.duration,req.body.financial_support,req.body.date,req.body.level,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_onlinecourses set n=$1,roll_no=$2,portal=$3,n_course=$4,duration=$5,financial_support=$6,date=$7 WHERE id=$8`,[req.body.n,req.body.roll_no,req.body.portal,req.body.n_course,req.body.duration,req.body.financial_support,req.body.date,req.body.level,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.post('/forms/student/s_achievements',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `INSERT INTO s_achievements(n,roll_no,prize,event,date,venue,level,department,file) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.body.n,req.body.roll_no,req.body.prize,req.body.event,req.body.date,req.body.venue,req.body.level,req.body.department,req.file.filename],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `INSERT INTO s_achievements(n,roll_no,prize,event,date,venue,level,department) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.body.n,req.body.roll_no,req.body.prize,req.body.event,req.body.date,req.body.venue,req.body.level,req.body.department],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.put('/forms/student/s_achievements/edit',upload.single('image'), async(req,res) => {
    try{
        if(req.file){
            pool.query(
                `UPDATE s_achievements set n=$1,roll_no=$2,prize=$3,event=$4,date=$5,venue=$6,level=$7,file=$8 WHERE id=$9`,[req.body.n,req.body.roll_no,req.body.prize,req.body.event,req.body.date,req.body.venue,req.body.level,req.file.filename,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
        else{
            pool.query(
                `UPDATE s_achievements set n=$1,roll_no=$2,prize=$3,event=$4,date=$5,venue=$6,level=$7 WHERE id=$8`,[req.body.n,req.body.roll_no,req.body.prize,req.body.event,req.body.date,req.body.venue,req.body.level,req.body.id],
                (err, result) => {
                    if(result){
                    res.json(result.rows)
                    }
                    console.log(err)
                }
            );
        }
    }catch(err){
        console.log(err)
    }
})

router.get('/logout',(req,res) => {
    res.clearCookie('department',{path: '/'})
    res.clearCookie('user_id',{ path: '/'})
    res.clearCookie('jwtoken',{path: '/'})
    res.status(200).send('User Logout')
})

module.exports = router