const express = require('express');
const app = express();
const cors = require('cors');
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

    const menuCollection = client.db("bistroDb").collection("menu")
    const reviewsCollection = client.db("bistroDb").collection("reviews")
    // const cartCollection = client.db("bistroDb").collection("carts")
    const addCollection = client.db("bistroDb").collection("add")



    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    })
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    //carts Collection 

    app.get ('/carts' , async (req , res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await addCollection.find(query).toArray();
      res.send (result)
    })

    app.post ('/carts' , async (req , res) => {
      const cartItem = req.body ; 
      const result = await addCollection.insertOne(cartItem)
      res.send (result)
    })

    app.delete ('/carts/:id', async (req , res) => {
      const id = req.params.id ;
      const query = {_id: new ObjectId (id)}
      const result = await addCollection.deleteOne (query);
      res.send (result);
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