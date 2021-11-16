const express = require('express')
const router = express.Router()
const cors = require('cors')

const authenticate = require('../Middleware/authenticate')

router.use(cors())
router.use(express.json())

const pool = require('../Db/db')

router.post('/', async (req,res) => {
    const {name,email,password,department,roll} = req.body
    if(!name || !email ||  !department || !password || !roll){
        return res.status(422).json({error: "Fill the fields"})
    }

    try{
        const userdata = pool.query(
            `INSERT INTO users (name,email,password,department,roll) VALUES($1,$2,$3,$4,$5)`,[name,email,password,department,roll],
            (err, res) => {
              console.log(err, res);
            }
        );
        res.json(req.body)
    }catch(err){
        console.log(err+'22')
    }
})

router.post('/signin', async(req,res) => {
    // console.log(req.body)
    // res.json({message: "Awesome"})

    try{
        let token
        const {email,password} = req.body
        if(!email || !password){
            return res.status(400).json({error: "Fill the data"})
        }

        const userLogin = await User.findOne({email: email})

        if(userLogin){
            const isMatch = await bcrypt.compare(password,userLogin.password)

            token = await userLogin.generateAuthToken()
            console.log(token)

            res.cookie("jwtoken",token,{
                expires: new Date(Date.now() + 25892000000),
                httpOnly: true
            })

            if(isMatch){
                res.json({message: "User Signin Successfully"})
            }
            else{
                res.status(400).json({error: "Login credentials Error"})
            }
        }
        else{
            res.status(400).json({error: "No User Found"})
        }
    }
    catch(err){
        console.log(err)
    }
})

router.get('/admin', async(req,res) => {
    res.send(req.rootUser)
})

router.get('/dashboard',authenticate,(req,res) => {
    res.send(req.rootUser)
})

router.get('/dashboard/profile',authenticate,(req,res) => {
    res.send(req.rootUser)
})

router.put('/dashboard/editprofile/:id',async (req,res) => {
    try{
        var {name,password,cpassword,ppassword,hashpassword,department} = req.body
        if(!name && !password && !cpassword  && !department){
            return res.status(400).json({error: "Fill the data"})
        }

        else if(name && !password && !cpassword){
            const user  =  await User.findById(req.params.id)

            if(!user){
                return res.status(404).send("USER Not Found")
            }
            else{
                const update = User.findByIdAndUpdate(req.params.id,{
                    name,
                    department
                },{new: true},function(err,data){
                    if(err){
                        res.send(err)
                        console.log(err)
                    }
                    else{
                        res.send(data)
                        console.log(data)
                    }
                })
            }
        }

        else if(password && cpassword && ppassword && hashpassword && !name){
            const user  =  await User.findById(req.params.id)
            if(password != cpassword){
                return res.status(422).json({error: "Passwords are not matching"})
            }
            else if(ppassword){
                const match = await bcrypt.compare(ppassword,hashpassword)

                if(!match){
                    return res.status(422).json({error: "Mismatching current password"})
                }
            }

            if(!user){
                return res.status(404).send("USER Not Found")
            }
            else{
                password = await bcrypt.hash(password,12)
                cpassword = await bcrypt.hash(cpassword,12)

                const update = User.findByIdAndUpdate(req.params.id,{
                    password,
                    cpassword
                },{new: true},function(err,data){
                    if(err){
                        res.send(err)
                        console.log(err)
                    }
                    else{
                        res.send(data)
                        console.log(data)
                    }
                })
            }
        }
    }
    catch(err){
        console.log(err)
    }
})

router.post('/forms/research/research_projects', async(req,res) => {
    const {user_id,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date} = req.body
    res.json(req.body)
    try{
        const userdata = pool.query(
            `INSERT INTO research_projects (user_id,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[user_id,title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date],
            (err, res) => {
              console.log(err, res);
            }
        );
        res.json(req.body)
    }catch(err){
        console.log(err+'22')
    }
})

router.post('/forms/research/research_projects/edit', async(req,res) => {
    const {title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,id} = req.body
    res.json(req.body)
    try{
        const userdata = pool.query(
            `UPDATE research_projects SET title=$1, no=$2, amount_sanctioned=$3, fileno=$4, amount_received=$5, date_sanctioned=$6, funding_agency=$7, date=$8 WHERE id=$9`,[title,no,amount_sanctioned,fileno,amount_received,date_sanctioned,funding_agency,date,id],
            function (err, res) {
                console.log(err, res)
            }
        );
        res.json(req.body)

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/research_projects/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{


            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.research_projects.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.research.research_projects.splice(i,1)
                    }
                })

                if(!user.forms.research.research_projects[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/patents', async(req,res) => {
    const {email,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,csvs,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }
                
                if(csvs){
                    let csv = csvs
                    console.log(csv)
                    csv.forEach((e)=>{
                        const {title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date} = e
                        csv.map((e)=>{
                            if(e.title == undefined || e.title == '' || e.field == undefined ||
                                e.fileno == undefined || e.date_awarded_patent == undefined || e.royalty_received == undefined || e.providing_agency == undefined || e.country == undefined || e.date == undefined || e.date == ''){
                                return res.status(422).json({ error: "Error : Missing field properties in the file"})
                            }
                        }) 

                        user.forms.research.patents.push({
                            "name" : user.name,
                            "title" : title,
                            "field" : field,
                            "fileno" : fileno,
                            "date_awarded_patent" : date_awarded_patent,
                            "royalty_received" : royalty_received,
                            "providing_agency" : providing_agency,
                            "country" : country,
                            "date" : date
                        })
                    })
                    
                    user.save()
        
                    return res.status(201).json({message: "Saved"}) 
                }   

                user.forms.research.patents.push({
                    "name" : user.name,
                    "title" : title,
                    "field" : field,
                    "fileno" : fileno,
                    "date_awarded_patent" : date_awarded_patent,
                    "royalty_received" : royalty_received,
                    "providing_agency" : providing_agency,
                    "country" : country,
                    "date" : date
                })
            
            user.save()

            return res.status(201).json({message: "Saved"}) 
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/patents/edit/:id/', async(req,res) => {
    const {email,title,field,fileno,date_awarded_patent,royalty_received,providing_agency,country,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.patents.map((e)=>{
                    if(e._id == req.params.id){
                        e.title = title,
                        e.field = field,
                        e.fileno = fileno,
                        e.date_awarded_patent = date_awarded_patent,
                        e.royalty_received = royalty_received,
                        e.providing_agency = providing_agency,
                        e.country = country,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/patents/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{


            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.patents.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.research.patents.splice(i,1)
                    }
                })

                if(!user.forms.research.patents[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/awards_for_innovation', async(req,res) => {
    const {email,awardee_name,designation,award_category,title,awarding_agency,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.research.awards_for_innovation.push({
                    "name" : user.name,
                    "awardee_name" : awardee_name,
                    "designation" :designation,
                    "award_category" : award_category,
                    "title" : title,
                    "awarding_agency" : awarding_agency,
                    "venue" : venue,
                    "level" : level,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/awards_for_innovation/edit/:id/', async(req,res) => {
    const {email,awardee_name,designation,award_category,title,awarding_agency,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.awards_for_innovation.map((e)=>{
                    if(e._id == req.params.id){
                        e.awardee_name = awardee_name,
                        e.designation = designation,
                        e.award_category = award_category,
                        e.title = title,
                        e.awarding_agency = awarding_agency,
                        e.venue = venue,
                        e.level = level,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/awards_for_innovation/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.awards_for_innovation.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.research.awards_for_innovation.splice(i,1)
                    }
                })

                if(!user.forms.research.awards_for_innovation[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/deg', async(req,res) => {
    const {email,deg,guide_name,title,external,venue,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.research.deg.push({
                    "name" : user.name,
                    "deg" : deg,
                    "guide_name" : guide_name,
                    "title" : title,
                    "external" : external,
                    "venue" : venue,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/deg/edit/:id/', async(req,res) => {
    const {email,deg,guide_name,title,external,venue,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.deg.map((e)=>{
                    if(e._id == req.params.id){
                        e.deg = deg,
                        e.guide_name = guide_name,
                        e.title = title,
                        e.external = external,
                        e.venue = venue,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/deg/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.deg.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.research.deg.splice(i,1)
                    }
                })

                if(!user.forms.research.deg[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/research/fellowship', async(req,res) => {
    const {email,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.research.fellowship.push({
                    "name" : user.name,
                    "fellowship" : fellowship,
                    "date_sanctioned" : date_sanctioned,
                    "funding_agency" : funding_agency,
                    "sanctioned_amount" : sanctioned_amount,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/fellowship/edit/:id/', async(req,res) => {
    const {email,fellowship,date_sanctioned,funding_agency,sanctioned_amount,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.fellowship.map((e)=>{
                    if(e._id == req.params.id){
                        e.fellowship = fellowship,
                        e.date_sanctioned = date_sanctioned,
                        e.funding_agency = funding_agency,
                        e.sanctioned_amount = sanctioned_amount,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/research/fellowship/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.research.fellowship.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.research.fellowship.splice(i,1)
                    }
                })

                if(!user.forms.research.fellowship[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/collaborative_activities', async(req,res) => {
    const {email,activity,participant,financial_support,period,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.collaboration.collaborative_activities.push({
                    "name" : user.name,
                    "activity" : activity,
                    "participant" : participant,
                    "financial_support" : financial_support,
                    "period" : period,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/collaborative_activities/edit/:id/', async(req,res) => {
    const {email,activity,participant,financial_support,period,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.collaboration.collaborative_activities.map((e)=>{
                    if(e._id == req.params.id){
                        e.activity = activity,
                        e.participant = participant,
                        e.financial_support = financial_support,
                        e.period = period,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/collaborative_activities/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.collaboration.collaborative_activities.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.collaboration.collaborative_activities.splice(i,1)
                    }
                })

                if(!user.forms.collaboration.collaborative_activities[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/linkages', async(req,res) => {
    const {email,title,partnering_agency,period,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.collaboration.linkages.push({
                    "name" : user.name,
                    "title" : title,
                    "partnering_agency" : partnering_agency,
                    "period" : period,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/linkages/edit/:id/', async(req,res) => {
    const {email,title,partnering_agency,period,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.collaboration.linkages.map((e)=>{
                    if(e._id == req.params.id){
                        e.title = title,
                        e.partnering_agency = partnering_agency,
                        e.period = period
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/linkages/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.collaboration.linkages.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.collaboration.linkages.splice(i,1)
                    }
                })

                if(!user.forms.collaboration.linkages[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/collaborations/mou', async(req,res) => {
    const {email,organization,date_signed,period,participants,purpose,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.collaboration.mou.push({
                    "name" : user.name,
                    "organization" : organization,
                    "date_signed" : date_signed,
                    "period" : period,
                    "participants" : participants,
                    "purpose" : purpose,
                    "total" : total,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/mou/edit/:id/', async(req,res) => {
    const {email,organization,date_signed,period,participants,purpose,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.collaboration.mou.map((e)=>{
                    if(e._id == req.params.id){
                        e.organization = organization,
                        e.date_signed = date_signed,
                        e.period = period,
                        e.participants = participants,
                        e.purpose = purpose,
                        e.total = total
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/collaborations/mou/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.collaboration.mou.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.collaboration.mou.splice(i,1)
                    }
                })

                if(!user.forms.collaboration.mou[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/conference', async(req,res) => {
    const {email,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.events.conference.push({
                    "name" : user.name,
                    "con_sem" : con_sem,
                    "title" : title,
                    "sponsoring_agency" : sponsoring_agency,
                    "resource_person" : resource_person,
                    "venue" : venue,
                    "objective" : objective,
                    "outcome" : outcome,
                    "level" : level,
                    "total" : total,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/conference/edit/:id/', async(req,res) => {
    const {email,con_sem,title,sponsoring_agency,resource_person,venue,objective,outcome,level,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.conference.map((e)=>{
                    if(e._id == req.params.id){
                        e.con_sem = con_sem,
                        e.title = title,
                        e.sponsoring_agency = sponsoring_agency,
                        e.resource_person = resource_person,
                        e.venue = venue,
                        e.objective = objective,
                        e.outcome = outcome,
                        e.level = level,
                        e.total = total,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/conference/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.conference.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.events.conference.splice(i,1)
                    }
                })

                if(!user.forms.events.conference[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/guest_lectures', async(req,res) => {
    const {email,resource_person,designation,topic,venue,objective,outcome,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.events.guest_lectures.push({
                    "name" : user.name,
                    "resource_person" : resource_person,
                    "designation" : designation,
                    "topic" : topic,
                    "venue" : venue,
                    "objective" : objective,
                    "outcome" : outcome,
                    "total" : total,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/guest_lectures/edit/:id/', async(req,res) => {
    const {email,resource_person,designation,topic,date_venue,objective,outcome,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.guest_lectures.map((e)=>{
                    if(e._id == req.params.id){
                        e.resource_person = resource_person,
                        e.designation = designation,
                        e.topic = topic,
                        e.date_venue = date_venue,
                        e.objective = objective,
                        e.outcome = outcome,
                        e.total = total,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/guest_lectures/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.guest_lectures.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.events.guest_lectures.splice(i,1)
                    }
                })

                if(!user.forms.events.guest_lectures[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/extension_activities', async(req,res) => {
    const {email,activities,collaborations,venue,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.events.extension_activities.push({
                    "name" : user.name,
                    "activities" : activities,
                    "collaborations" : collaborations,
                    "venue" : venue,
                    "total" : total,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/extension_activities/edit/:id/', async(req,res) => {
    const {email,activities,collaborations,venue,total,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.extension_activities.map((e)=>{
                    if(e._id == req.params.id){
                        e.activities = activities,
                        e.collaborations = collaborations,
                        e.venue = venue,
                        e.total = total,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/extension_activities/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.extension_activities.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.events.extension_activities.splice(i,1)
                    }
                })

                if(!user.forms.events.extension_activities[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/industrial_visits', async(req,res) => {
    const {email,classes,date,address,total,outcome,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.events.industrial_visits.push({
                    "name" : user.name,
                    "classes" : classes,
                    "date" : date,
                    "address" : address,
                    "total" : total,
                    "outcome" : outcome
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/industrial_visits/edit/:id/', async(req,res) => {
    const {email,classes,date,address,total,outcome} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.industrial_visits.map((e)=>{
                    if(e._id == req.params.id){
                        e.classes = classes,
                        e.date = date,
                        e.address = address,
                        e.total = total,
                        e.outcome = outcome
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/industrial_visits/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.industrial_visits.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.events.industrial_visits.splice(i,1)
                    }
                })

                if(!user.forms.events.industrial_visits[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/evs', async(req,res) => {
    const {email,date,place,total,activity} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.events.evs.push({
                    "name" : user.name,
                    "date" : date,
                    "place" : place,
                    "total" : total,
                    "activity" : activity
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/evs/edit/:id/', async(req,res) => {
    const {email,date,place,total,activity} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.evs.map((e)=>{
                    if(e._id == req.params.id){
                        e.date = date,
                        e.place = place,
                        e.total = total,
                        e.activity = activity
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/evs/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.evs.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.events.evs.splice(i,1)
                    }
                })

                if(!user.forms.events.evs[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/events/departmental_activities', async(req,res) => {
    const {email,activity,guest,topic,total,venue,filled,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.events.departmental_activities.push({
                    "name" : user.name,
                    "activity" : activity,
                    "guest" : guest,
                    "topic" : topic,
                    "total" : total,
                    "venue" : venue,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/departmental_activities/edit/:id/', async(req,res) => {
    const {email,activity,guest,topic,total,venue,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.departmental_activities.map((e)=>{
                    if(e._id == req.params.id){
                        e.activity = activity,
                        e.guest = guest,
                        e.topic = topic,
                        e.total = total,
                        e.venue = venue
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/events/departmental_activities/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.events.departmental_activities.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.events.departmental_activities.splice(i,1)
                    }
                })

                if(!user.forms.events.departmental_activities[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/consultancy/projects_services', async(req,res) => {
    const {email,title,no,revenue_generated,date_sanction,sponsor,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.consultancy.projects_services.push({
                    "name" : user.name,
                    "title" : title,
                    "no" : no,
                    "revenue_generated" : revenue_generated,
                    "date_sanction" : date_sanction,
                    "sponsor" : sponsor,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/consultancy/projects_services/edit/:id/', async(req,res) => {
    const {email,title,no,revenue_generated,date_sanction,sponsor,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.consultancy.projects_services.map((e)=>{
                    if(e._id == req.params.id){
                        e.title = title,
                        e.no = no,
                        e.revenue_generated = revenue_generated,
                        e.date_sanction = date_sanction,
                        e.sponsor = sponsor,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/consultancy/projects_services/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.consultancy.projects_services.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.consultancy.projects_services.splice(i,1)
                    }
                })

                if(!user.forms.consultancy.projects_services[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/honours', async(req,res) => {
    const {email,award_honour,details,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.honours.push({
                    "name" : user.name,
                    "award_honour" : award_honour,
                    "details" : details,
                    "venue" : venue,
                    "level" : level,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/honours/edit/:id/', async(req,res) => {
    const {email,award_honour,details,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.honours.map((e)=>{
                    if(e._id == req.params.id){
                        e.award_honour = award_honour,
                        e.details = details,
                        e.venue = venue,
                        e.level = level,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/honours/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.honours.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.honours.splice(i,1)
                    }
                })

                if(!user.forms.faculty.honours[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/exams', async(req,res) => {
    const {email,exam,exam_rollno,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.exams.push({
                    "name" : user.name,
                    "exam" : exam,
                    "exam_rollno" : exam_rollno,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/exams/edit/:id/', async(req,res) => {
    const {email,exam,exam_rollno,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.exams.map((e)=>{
                    if(e._id == req.params.id){
                        e.exam = exam,
                        e.exam_rollno = exam_rollno,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/exams/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.exams.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.exams.splice(i,1)
                    }
                })

                if(!user.forms.faculty.exams[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/books_published', async(req,res) => {
    const {email,name,publisher,level,isbn_no,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.books_published.push({
                    "name" : user.name,
                    "book" : name,
                   "publisher" : publisher,
                    "level" : level,
                    "isbn_no" : isbn_no,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/books_published/edit/:id/', async(req,res) => {
    const {email,name,publisher,level,isbn_no,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.books_published.map((e)=>{
                    if(e._id == req.params.id){
                        e.book = name,
                        e.publisher = publisher,
                        e.level = level,
                        e.isbn_no = isbn_no,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/books_published/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.books_published.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.books_published.splice(i,1)
                    }
                })

                if(!user.forms.faculty.books_published[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/chapters_contributed', async(req,res) => {
    const {email,title,chapter,editor,publisher,level,isbn_no,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.chapters_contributed.push({
                    'name' : user.name,
                    "title" : title,
                    "chapter" : chapter,
                    "editor" : editor,
                    "publisher" : publisher,
                    "level" : level,
                    "isbn_no" : isbn_no,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/chapters_contributed/edit/:id/', async(req,res) => {
    const {email,title,chapter,editor,publisher,level,isbn_no,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.chapters_contributed.map((e)=>{
                    if(e._id == req.params.id){
                        e.title = title,
                        e.chapter = chapter,
                        e.editor = editor,
                        e.publisher = publisher,
                        e.level = level,
                        e.isbn_no = isbn_no
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/chapters_contributed/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.chapters_contributed.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.chapters_contributed.splice(i,1)
                    }
                })

                if(!user.forms.faculty.chapters_contributed[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/conference_proceeding', async(req,res) => {
    const {email,con,publication,level,isbn_no,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.conference_proceeding.push({
                    "name" : user.name,
                    "con" : con,
                    "publication" : publication,
                    "level" : level,
                    "isbn_no" : isbn_no,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference_proceeding/edit/:id/', async(req,res) => {
    const {email,con,publication,level,isbn_no,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.conference_proceeding.map((e)=>{
                    if(e._id == req.params.id){
                        e.con = con,
                        e.publication = publication,
                        e.level = level,
                        e.isbn_no = isbn_no,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference_proceeding/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.conference_proceeding.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.conference_proceeding.splice(i,1)
                    }
                })

                if(!user.forms.faculty.conference_proceeding[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/paper_presentation', async(req,res) => {
    const {email,con,title,financial_support,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.paper_presentation.push({
                    "name" : user.name,
                    "con" : con,
                    "title" : title,
                    "financial_support" : financial_support,
                    "level" : level,
                    "venue" : venue,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/paper_presentation/edit/:id/', async(req,res) => {
    const {email,con,title,financial_support,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.paper_presentation.map((e)=>{
                    if(e._id == req.params.id){
                        e.con = con,
                        e.title = title,
                        e.financial_support = financial_support,
                        e.venue = venue,
                        e.level = level,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/paper_presentation/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.paper_presentation.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.paper_presentation.splice(i,1)
                    }
                })

                if(!user.forms.faculty.paper_presentation[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/journal_publications', async(req,res) => {
    const {email,title,jou,issn_no,volume,sci,impact,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.journal_publications.push({
                    "jou" : jou,
                    "title" : title,
                    "name" : user.name,
                    "issn_no" : issn_no,
                    "volume" : volume,
                    "sci" : sci,
                    "impact" : impact,
                    "level" : level,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/journal_publications/edit/:id/', async(req,res) => {
    const {email,title,jou,issn_no,volume,sci,impact,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.journal_publications.map((e)=>{
                    if(e._id == req.params.id){
                        e.title = title,
                        e.jou = jou,
                        e.issn_no = issn_no,
                        e.volume = volume,
                        e.sci = sci,
                        e.impact = impact,
                        e.level = level,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/journal_publications/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.journal_publications.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.journal_publications.splice(i,1)
                    }
                })

                if(!user.forms.faculty.journal_publications[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/conference', async(req,res) => {
    const {email,con,title,venue,level,financial_support,programme_outcome,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.conference.push({
                    "name" : user.name,
                    "con" : con,
                    "title" : title,
                    "venue" : venue,
                    "level" : level,
                    "financial_support" : financial_support,
                    "programme_outcome" : programme_outcome,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference/edit/:id/', async(req,res) => {
    const {email,con,title,venue,level,financial_support,programme_outcome,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.conference.map((e)=>{
                    if(e._id == req.params.id){
                        e.con = con,
                        e.title = title,
                        e.venue = venue,
                        e.level = level
                        e.financial_support = financial_support,
                        e.programme_outcome = programme_outcome,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/conference/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.conference.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.conference.splice(i,1)
                    }
                })

                if(!user.forms.faculty.conference[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/resource_person', async(req,res) => {
    const {email,sem,topic,event,venue,level,filled,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.resource_person.push({
                    "name" : user.name,
                    "sem" : sem,
                    "topic" : topic,
                    "event" : event,
                    "venue" : venue,
                    "level" : level,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/resource_person/edit/:id/', async(req,res) => {
    const {email,sem,topic,event,venue,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.resource_person.map((e)=>{
                    if(e._id == req.params.id){
                        e.sem = sem,
                        e.topic = topic,
                        e.event = event,
                        e.venue = venue,
                        e.level = level,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/resource_person/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.resource_person.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.resource_person.splice(i,1)
                    }
                })

                if(!user.forms.faculty.resource_person[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/financial_support', async(req,res) => {
    const {email,f,amount_support,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.financial_support.push({
                    "name" : user.name,
                    "f" : f,
                    "amount_support" : amount_support,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/financial_support/edit/:id/', async(req,res) => {
    const {email,f,amount_support,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.financial_support.map((e)=>{
                    if(e._id == req.params.id){
                        e.f = f,
                        e.amount_support = amount_support,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/financial_support/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.financial_support.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.financial_support.splice(i,1)
                    }
                })

                if(!user.forms.faculty.financial_support[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/development_programmes', async(req,res) => {
    const {email,training,title,venue,financial_support,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.development_programmes.push({
                    "name" : user.name,
                    "training" : training,
                    "title" : title,
                    "venue" : venue,
                    "financial_support" : financial_support,
                    "level" : level,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/development_programmes/edit/:id/', async(req,res) => {
    const {email,training,title,venue,financial_support,level,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.development_programmes.map((e)=>{
                    if(e._id == req.params.id){
                        e.training = training,
                        e.title = title,
                        e.venue = venue,
                        e.financial_support = financial_support,
                        e.level = level,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/development_programmes/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.development_programmes.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.development_programmes.splice(i,1)
                    }
                })

                if(!user.forms.faculty.development_programmes[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/online_courses', async(req,res) => {
    const {email,training,title,duration,date,financial_support,level,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.online_courses.push({
                    "name" : user.name,
                    "training" : training,
                    "title" : title,
                    "duration" : duration,
                    "date" : date,
                    "financial_support" : financial_support,
                    "level" : level
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/online_courses/edit/:id/', async(req,res) => {
    const {email,training,title,duration,date,financial_support,level} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.online_courses.map((e)=>{
                    if(e._id == req.params.id){
                        e.training = training,
                        e.title = title,
                        e.duration = duration,
                        e.date = date,
                        e.financial_support = financial_support,
                        e.level = level
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/online_courses/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.online_courses.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.online_courses.splice(i,1)
                    }
                })

                if(!user.forms.faculty.online_courses[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.post('/forms/faculty/e_content', async(req,res) => {
    const {email,module,platform,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                user.forms.faculty.e_content.push({
                    "name" : user.name,
                    "module" : module,
                    "platform" : platform,
                    "date" : date
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/e_content/edit/:id/', async(req,res) => {
    const {email,module,platform,date} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.e_content.map((e)=>{
                    if(e._id == req.params.id){
                        e.module = module,
                        e.platform = platform,
                        e.date = date
                    }
                })

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.put('/forms/faculty/e_content/delete/:id/', async(req,res) => {
    const {email,filled} = req.body
    try{
        if(!email){
            return res.status(400).json({error: "Some error"})
        }
        else{
            const userLogin = await User.findOne({email: email}).then(user =>{
                if(!user){
                    return res.status(422).json({ error: "User does not exits with this email" })
                }

                const update = user.forms.faculty.e_content.map((e,i)=>{
                    if(e._id == req.params.id){
                        user.forms.faculty.e_content.splice(i,1)
                    }
                })

                if(!user.forms.faculty.e_content[0]){
                    user.filled = filled - 1
                }

                user.save()

                return res.status(201).json({message: "Saved"})
            })
        }

    }catch(err){
        console.log(err)
    }
})

router.get('/resetpassword',authenticate,(req,res) => {
    res.send(req.rootUser)
})

router.post('/resetpassword',async (req,res)=>{
    try{
        const {email} = req.body.email

        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
              user: 'kamalesh1132002@gmail.com',
              pass: 'kamalesh5050'
            }
        }));

        var mailOptions = {
            from: 'ikamaloffc@gmail.com',
            to: `${email}`,
            subject: 'Sending Email using Node.js[nodemailer]',
            text: 'That was easy!'
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

    }catch(err){
        console.log(err,"169")
    }
    // try{
    //     crypto.randomBytes(32, (err, buffer) => {
    //         if (err) {
    //             console.log(err)
    //         }

    //         const token = buffer.toString("hex")
    //         User.findOne({ email: req.body.email })
    //             .then(users => {
    //                 if (!users) {
    //                     return res.status(422).json({ error: "User does not exits with this email" })
    //                 }

    //                 users.resetToken = token
    //                 users.expireToken = Date.now() + 3600000
    //                 users.save().then((result) => {
    //                     async function main() {
    //                         // Generate test SMTP service account from ethereal.email
    //                         // Only needed if you don't have a real mail account for testing
    //                         let testAccount = await nodemailer.createTestAccount()

    //                         // create reusable transporter object using the default SMTP transport
    //                         let transporter = nodemailer.createTransport({
    //                             host: "smtp.ethereal.email",
    //                             port: 587,
    //                             secure: false,
    //                             auth: {
    //                                 user: testAccount.user,
    //                                 pass: testAccount.pass, // generated ethereal password
    //                             },
    //                         })

    //                         // send mail with defined transport object
    //                         let info = await transporter.sendMail({
    //                             from: 'ikamaloffc@gmail.com>',
    //                             to: `${users.name}`,
    //                             subject: "Hello ✔",
    //                             text: "Hello world?",
    //                             html: "<b>Hello world?</b>", // html body
    //                         })

    //                         console.log("Message sent: %s", info.messageId)
    //                         // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    //                         // Preview only available when sending through an Ethereal account
    //                         console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    //                         // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    //                     }

    //                     main().catch(console.error)
    //                 }).catch((err) => {
    //                     console.log(err)
    //                 })
    //             }).catch((err) => {
    //                 console.log(err)
    //             })
    //     })
    // }
    // catch(err){
    //     console.log(err)
    // }
})

router.get('/logout',(req,res) => {
    res.clearCookie('jwtoken',{ path: '/'})
    res.status(200).send('User Logout')
})

module.exports = router