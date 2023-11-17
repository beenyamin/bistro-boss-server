const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rmje4mv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const userCollection = client.db("bistroDb").collection("users")
    const menuCollection = client.db("bistroDb").collection("menu")
    const reviewsCollection = client.db("bistroDb").collection("reviews")
    const addCollection = client.db("bistroDb").collection("add") //cart

    //jwt related api 

    app.post ('/jwt' , async (req , res) => {
      const user = req.body ;
      const token = jwt.sign(user , process.env.ACCESS_TOKEN , {
        expiresIn: '4d'})
        res.send ({token})

    })

    //middleWare 

    const verifyToken = (req , res , next) => {
      console.log( 'inside verify token', req.headers.authorization);
    
      if (!req.headers.authorization) {
        return res.status(401).send ({message: ' Unauthorized access'})       
      }
      const token = req.headers.authorization.split(' ')[1]
         jwt.verify ( token , process.env.ACCESS_TOKEN , (err , decoded) => {
               if (err) {
                return res.status(401).send ({message:' unauthorized access'})
               }

               req.decoded = decoded ;
               next ();
         })
    }

 // use verify admin after verifyToken
    const verifyAdmin = async (req , res , next) => {
      const email = req.decoded.email ;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';

      if (!isAdmin) {
        return res.status(403).send ({message : 'forbidden access'})
        
      }
    }

    //users related api 

    app.get ('/users' , verifyToken, verifyAdmin, async (req , res) => {
      const result = await userCollection.find().toArray();
      res.send (result);
    })

    app.get ('/users/admin/:email' , verifyToken , async (req , res ) => {
      const email = req.params.email ;

      if (email !== req.decoded.email) {
        return res.status(403).send({message: 'forbidden access'})        
      }

      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }
      return res.send ({admin});
    })


    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if user does not exists:
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = {email: user.email}
      const existingUSer = await userCollection.findOne (query);
      if (existingUSer) {
        return res.send ({message: 'user already exist', insertedId: null})
      }
  
      const result = await userCollection.insertOne(user);
      res.send(result);
    })


    app.patch ('/users/admin/:id' ,verifyToken, verifyAdmin, async (req , res) => {
      const id = req.params.id 
      const filter = { _id: new ObjectId (id)};
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne (filter , updatedDoc)
      res.send (result)

    })


    app.delete('/users/:id' ,verifyToken,verifyAdmin, async (req , res) => {
      const id = req.params.id 
      const query = {_id: new ObjectId (id)}
      const result = await userCollection.deleteOne(query);
      res.send (result);
    })



    //menu related api

    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    })
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    //carts Collection 

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await addCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await addCollection.insertOne(cartItem)
      res.send(result)
    })

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addCollection.deleteOne(query);
      res.send(result);
    })






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Boss is Starting')
})

app.listen(port, () => {
  console.log(`Bistro Boss is starting on port ${port}`);
})