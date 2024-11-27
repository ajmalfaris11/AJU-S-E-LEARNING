import { app } from "./app"

require("dotenv").config();


// create server
const port = process.env.PORT || 5000

app.listen(port, () => {
    console.log(`Server is Connecterd with port ${port}`);
} )