const mongoose  = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required: true
    },
    department:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    cpassword:{
        type: String,
        required: true
    },
    resetToken: String,
    expireToken: Date,
    forms: {
        research:{
            research_projects:[
                {
                    name:String,
                    title:String,
                    no:String,
                    amount_sanctioned:String,
                    fileno:String,
                    amount_received:String,
                    date_sanctioned:String,
                    funding_agency:String,
                    date:String
                }
            ],
            patents:[
                {
                    name:String,
                    field:String,
                    title:String,
                    fileno:String,
                    date_awarded_patent:String,
                    royalty_received:String,
                    providing_agency:String,
                    country:String,
                    date:String
                }
            ],
            awards_for_innovation:[
                {
                    name:String,
                    awardee_name:String,
                    designation:String,
                    award_category:String,
                    title:String,
                    awarding_agency:String,
                    venue:String,
                    level:String,
                    date:String
                }
            ],
            deg:[
                {
                    name:String,
                    deg:String,
                    guide_name:String,                                       
                    title:String,
                    external:String,
                    venue:String,
                    date:String
                }
            ],
            fellowship:[
                {
                    name:String,
                    fellowship:String,
                    date_sanctioned:String,
                    funding_agency:String,
                    sanctioned_amount:String,
                    date:String
                }
            ]
        },
        collaboration:{
            collaborative_activities:[
                {
                    activity:String,
                    name:String,
                    participant:String,
                    financial_support:String,
                    period:String,
                    date:String
                }
            ],
            linkages:[
                {
                    name:String,
                    title:String,
                    partnering_agency:String,
                    period:String,
                    date:String
                }
            ],
            mou:[
                {
                    name: String,
                    organization: String,
                    date_signed: String,
                    period: String,
                    participants: String,
                    purpose: String,
                    total: String,
                    date:String
                }
            ]
        },
        events:{
            conference:[
                {
                    name:String,
                    con_sem:String,                                  
                    title:String,
                    sponsoring_agency:String,
                    resource_person:String,
                    venue:String,
                    objective:String,
                    outcome:String,
                    level:String,
                    total:String,
                    date:String
                }
            ],
            guest_lectures:[
                {
                    name:String,
                    resource_person:String,                                  
                    designation:String,
                    topic:String,
                    venue:String,
                    objective:String,
                    outcome:String,
                    total:String,
                    date:String
                }
            ],
            extension_activities:[
                {
                    name:String,
                    activities:String,                                  
                    collaborations:String,
                    venue:String,
                    total:String,
                    date:String
                }
            ],
            industrial_visits:[
                {
                    name:String,
                    classes:String,               
                    date:String,
                    address:String,
                    total:String,
                    outcome:String
                }
            ],
            evs:[
                {
                    name:String,
                    date:String,   
                    place:String,               
                    total:String,
                    activity:String
                }
            ],
            departmental_activities:[
                {
                    name:String,
                    activity:String,                               
                    guest:String,
                    topic:String,
                    total:String,
                    venue:String,
                    date:String
                }
            ]
        },
        consultancy:{
            projects_services:[
                {
                    name:String,
                    title:String,
                    no:String,
                    revenue_generated:String,
                    date_sanction:String,
                    sponsor:String,
                    date:String
                }
            ]
        },
        faculty:{
            honours:[
                {
                    name:String,
                    award_honour:String,
                    details:String,
                    venue:String,
                    level:String,
                    date:String
                }
            ],
            exams:[
                {
                    name:String,
                    exam:String,
                    exam_rollno:String,
                    date:String
                }
            ],
            books_published:[
                {
                    name:String,
                    book:String,
                    publisher:String,
                    level:String,
                    isbn_no:String,
                    date:String
                }
            ],
            chapters_contributed:[
                {
                    name:String,
                    title:String,
                    chapter:String,
                    editor:String,
                    publisher:String,
                    level:String,
                    isbn_no:String,
                    date:String
                }
            ],
            conference_proceeding:[
                {
                    name:String,
                    con:String,
                    publication:String,
                    level:String,
                    isbn_no:String,
                    date:String
                }
            ],
            paper_presentation:[
                {
                    name:String,
                    con:String,
                    title:String,
                    financial_support:String,
                    venue:String,
                    level:String,
                    date:String
                }
            ],
            journal_publications:[
                {
                    title:String,                                   
                    name:String,
                    jou:String,
                    issn_no:String,
                    volume:String,
                    sci:String,
                    impact:String,
                    level:String,
                    date:String
                }
            ],
            conference:[
                {
                    name:String,
                    con:String,  
                    title:String,                              
                    venue:String,
                    level:String,
                    financial_support:String,
                    programme_outcome:String,
                    date:String
                }
            ],
            resource_person:[
                {
                    name:String,
                    sem:String,  
                    topic:String, 
                    event:String,                             
                    venue:String,
                    level:String,
                    date:String
                }
            ],
            financial_support:[
                {
                    name:String,  
                    amount_support:String,
                    date:String,
                    f:String
                }
            ],
            development_programmes:[
                {
                    name:String,
                    training:String,  
                    title:String,                            
                    venue:String,
                    financial_support:String,  
                    level:String,
                    date:String
                }
            ],
            online_courses:[
                {
                    name:String,
                    training:String,  
                    title:String,                            
                    duration:String,
                    date:String,
                    financial_support:String,  
                    level:String
                }
            ],
            e_content:[
                {
                    name:String,
                    module:String,  
                    platform:String,                            
                    date:String
                }
            ]
        }
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})

// hashing the password

userSchema.pre('save', async function(next){
    console.log('from hash')
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,12)
        this.cpassword = await bcrypt.hash(this.cpassword,12)
    }
    next()
})

// generating token

userSchema.methods.generateAuthToken = async function(){
    try{
        let token = jwt.sign({_id:this._id},process.env.SECRET_KEY)
        this.tokens = this.tokens.concat({token:token})
        await this.save()
        return token
    }
    catch(err){
        console.log(err)
    }
}

const User = mongoose.model('REGISTER',userSchema)

module.exports = User