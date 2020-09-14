const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const passport = require('passport');
var saltRounds = 10;

const checksum_lib = require('./Paytm_Web_Sample_Kit_NodeJs/checksum/checksum');

const User = require('./models/User');
const mongoose = require('mongoose');
const jsonwtStrategy = require('./strategies/jsonwtStrategy');
const { parse } = require('path');
const db = require('./mysetup/myurl').myurl;

const app = express();


const port = process.env.PORT || 3000;

mongoose
    .connect(db)
    .then(()=>{
        console.log('Database is connected');
    })
    .catch(err=>{
        console.log('Error is: ', err.message);
    })

app.use(bodyParser.urlencoded({extended: true}));
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

//passport middleware
app.use(passport.initialize());
require('./strategies/jsonwtStrategy')(passport);


app.get('/', (req, res)=>{
    res.status(200);
    res.render('signup');
})

app.post('/signupauth', async (req, res)=>{
    var newUser = new User({
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        phone: req.body.phone
    })
    await User.findOne({email: newUser.email})
        .then(async profile=>{
            if(!profile){
                bcrypt.hash(newUser.password, saltRounds, async(err, hash)=>{
                    if(err){
                        console.log('Error is: ', err.message);
                    }else{
                        newUser.password = hash;
                        await newUser
                        .save()
                        .then(()=>{
                            res.status(200);
                            res.redirect('login')
                        })
                        .catch(err=>{
                            console.log('Error is: ', err.message);
                        });
                    }
                })
               
            }else{
                res.render('',useralreadyexist)
            }
        })
    // await newUser
    // .save()
    // .then(()=>{
    //     res.status(200);
    //     res.redirect('dashboard')
    // })
    // .catch(err=>{
    //     console.log('Error is: ', err.message);
    // })
})

app.get('/login', (req, res)=>{
    res.render('login');
})

app.post('/loginauth', async (req, res)=>{
    var newUser = {};
    newUser.email = req.body.email;
    newUser.password = req.body.password;

    await User.findOne({email: newUser.email})
        .then(profile =>{
            if(!profile){
                res.send('User does not exist')
            }else{
                bcrypt.compare(
                    newUser.password,
                    profile.password,
                    async (err, result) =>{
                        if(err){
                            console.log('Error is: ', err.message);
                        }else if(result == true){












                            res.render('dashboard');












                            // const payload = {
                            //     id: profile.id,
                            //     email: profile.email
                            // };
                            // jsonwt.sign(
                            //     payload,
                            //     key.secret,
                            //         {expiresIn: 3600},
                            //     (err, token) => {
                            //         res.json({
                            //             success: true,
                            //             token: "Bearer " + token
                            //         });
                            //         res.render('dashboard');
                            //     }
                            // );
                        }else{
                            res.render('',userunauthorizedaccess);
                        }
                    }
                )

                
            }
        })
        .catch(err=>{
            console.log('Error is: ', err.message);
        })
})

app.get(
    '/dashboard',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        console.log(req);
        res.json({
            id: req.user.id,
            name: req.user.name
        });
        res.render('dashboard',{})
    }
);
app.get('/payment', (req, res)=>{

    let programming = req.query.programming;
    let english = req.query.english;
    let toefl = req.query.toefl;

    let one = parseInt(programming);
    let two = parseInt(english);
    let three = parseInt(toefl);
    console.log('one',one)

    var sum = one + two + three;
    console.log(sum)//sum to be passed to the parameters
    
     let params = {}
     params['MID'] = 'oZWuqf92508371324733',
     params['WEBSITE'] = 'WEBSTAGING',
     params['CHANNEL_ID'] = 'WEB',
     params['INDUSTRY_TYPE_ID'] = 'Retail',
     params['ORDER_ID'] = 'ORD0005',
     params['CUST_ID'] = 'CUST0015',
     params['TXN_AMOUNT'] = sum.toString(),
     params['CALLBACK_URL'] = 'http://localhost'+port+'/callback',
     params['EMAIL'] = 'one@one.com',
     params['MOBILE_NO'] = '9115490856'

    exports.data = this.params;
     

    checksum_lib.genchecksum(params, 'dWbzkVhz0yi7G9i!',(err, checksum)=>{
        let txn_url = 'https://securegw-stage.paytm.in/order/process'

        let form_fields = ''
        for (x in params){
            form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"'>"
        }
        form_fields+="<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"'/>"

        var html = '<html><body><center><h1>Please wait, Do not refresh the page<h1></center><form method="post" action="'+txn_url+'" name="f1">"'+form_fields +'</form><script type="text/javascript">document.f1.submit()</script></body></html>'
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write(html);
        res.end();
        // res.render('html',{transactionUrl:txn_url, form_fields:form_fields})
        
    })

})





app.listen(port, ()=>{
    console.log(`Server has started on port: ${port}`);
})