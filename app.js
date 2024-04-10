import express from 'express'
import bodyParser from 'body-parser'
import { scrypt, randomBytes, randomUUID } from 'node:crypto'

const app = express()
app.use(bodyParser.json()); // MIDDLEWARE PARA SOLICITUDES JSON

const users = [{
    username: 'admin',
    name: 'Gustavo Alfredo Marín Sáez',
    password: '1b6ce880ac388eb7fcb6bcaf95e20083:341dfbbe86013c940c8e898b437aa82fe575876f2946a2ad744a0c51501c7dfe6d7e5a31c58d2adc7a7dc4b87927594275ca235276accc9f628697a4c00b4e01' // certamen123
}]
const todos = []

app.use(express.static('public'))

// Su código debe ir aquí...


// HELLO WORLD!

app.get('/api', (req, res) => {   //se realiza solicitud get a la api, en formato texto plano con mensaje hello world con codigo de estado 200
    res.contentType('text/plain');
    res.status(200).send('Hello World!'); 
})


//LOGIN



app.post('/api/login', async (req, res)  => {
    res.contentType('application/json');

    const nuevoUsuario = req.body.username;   //obtengo variables
    const passUsuario = req.body.password;

    if (nuevoUsuario == undefined || nuevoUsuario == "")  //valida si viene vacia o no definida
        res.status(400).send("Ingrese un usuario válido")
    if (passUsuario == undefined || passUsuario == "") 
        res.status(400).send("Ingrese una contraseña válida")

    const IndexUsuario = users.findIndex((user) => user.username == nuevoUsuario); //obtiene la posicion donde se almacena el usuario en el array

    if (IndexUsuario == -1) {   //valida si no existe usuario error 401
        res.status(401).send("Usuario o contraseña Incorrectos")
    } else {

        try {
            const isValidCredentials = validarContraseña(passUsuario, users[IndexUsuario].password);  //valida contraseña 
            if (!isValidCredentials)
            {
                res.status(401).send("Usuario o contraseña Incorrectos")  //si no son validadas credecniales datos incorrectos
            }
            else
            {
                const resp = {  //crea el objeto json del usuario logeado
                    username: users[IndexUsuario].username, 
                    name: users[IndexUsuario].name,
                    token: generarBearerToken(users[IndexUsuario].username)
                }

                res.status(200).send(resp);
            }
        }
        catch (err)
        {
            console.log(err)
        }
    }
})


 // LISTAR ITEMS

 app.get("/api/todos", (req, res)  =>  {
    res.contentType('application/json');  //establece el tipo de contenido de la respuesta como json
    let lista = []                       //crea un array vacio llamado lista y almacena los elementos de la lista todos

    todos.forEach(element => {          //repitecada elemnto en la lista todos  y agrega las propiedades en la  a la lista

        lista.push({
            id: element.id,
            title: element.title,
            completed: element.completed
        })
    });

    res.status(200).send(lista);  //codigo de estado como 200 y envia la lista en formato json
})


// OBTENER ITEMS

app.get("/api/todos/:id", (req, res) => {
    res.contentType('application/json');     //establece el tipo de contenido de la respuesta como json

    const id = req.params.id;               //obtiene valor del parametro id de la URL

    const Index = todos.findIndex((t) => t.id == id);  // busca el indice del elemnto en la lista todos  y que el id coincida coincida con id de la URL

    if (Index == -1) {                      //verifica si encontro el elemento en la lista todos
        res.status(404).send("Item no existe");  //si index es -1 el elemnto no fue encontrado en la lista, el cual envia respuesta con codigo 404 (no existe)
    } else {
        const respuesta = {                //si encontro elemento en la lista se crea objeto de respuesta con todas las propiedades
            id: todo[Index].id,
            title: todo[Index].title,
            completed: todo[Index].completed
        }
        res.status(200).send(respuesta);   //codigo de estado como 200 y envia objeto como respuesta
    }
})


// CREACION DE ITEM

app.post("/api/todos", (req, res) => {
    res.contentType('application/json');  //establece el tipo de contenido de la respuesta como json
    
    try {
        const title = req.body.title;

        const todo = {
            id: randomUUID().toString(),
            title: title,
            completed: false
        }

        todos.push(todo);
    
        res.status(201).send(todo);
    } catch (err) {
        res.status(400);
    } 
})

// ACTUALIZACION DE ITEM

app.put("/api/todos/:id", (req, res) => {
    res.contentType('application/json');  //establece el tipo de contenido de la respuesta como json

    const id = req.params.id;
    const title = req.body.title;
    const completed = req.body.completed;
    
    try {

        const Index = todos.findIndex((todo) => todo.id == id);

        let todoExiste = todos[Index];

        const todo = {
            id: id,
            title: title ? title : todoExiste.title,
            completed: completed ? completed : todoExiste.completed
        }
    
        todos[Index] = todo;

        res.status(200).send(todo);
    } catch (err) {
        res.status(400);
    } 
})


// BORRAR ITEM

app.delete("/api/todos/:id", (req, res) => {
    const id = req.params.id;
        const Index = todos.findIndex((todo) => todo.id == id);
    if (Index !== -1)
     {
        todos.splice(Index, 1);
        res.status(204).send();

    } else  {
        res.status(404).send("Item no existe");
    } 
})


// REQUISITOS

async function validarContraseña(contraseña, hashAlmacenado) {

    const [salt, hash] = hashAlmacenado.split(':');
    const hashRecreado = await generarHash(contraseña, Buffer.from(salt, 'hex'));
    return hashRecreado === hash;
   
}

async function generarHash(contraseña, salt) {
    return new Promise((resolve, reject) => {
        scrypt(contraseña, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex'));
        });
    });
}

function generarBearerToken(username) {

    // Generar una cadena aleatoria para el token
    const token = randomBytes(32).toString('hex');

    
    // Combinar los datos custom y el token en un objeto
    const tokenData = {
       username: username,
    
    };

    
    // Concatenar la cadena JSON con la cadena hexadecimal
    const tokenCompleto = JSON.stringify(tokenData);

    

    return tokenCompleto;
}

// ... hasta aquí

export default app


