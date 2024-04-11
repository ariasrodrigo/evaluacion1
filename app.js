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

//FUNCION MIDDLEWARE

function validateMiddleware(req, res, next) {
    const authHeader = req.headers['x-authorization'];

    if (!authHeader || authHeader.trim() === '') {
        console.log('El encabezado de autorización está vacío o no está definido.');
        return res.status(401).send();
    }

    let user;
    try {
        const jsonObject = JSON.parse(authHeader);
        user = jsonObject.username;
    } catch (error) {
        console.error('Error al analizar el encabezado de autorización JSON:', error.message);
        return res.status(401).send();
    }

    const userIndex = users.findIndex((u) => u.username == user);
    if (userIndex === -1) {
        console.log("Usuario no encontrado en la lista");
        return res.status(401).send();
    }

    console.log("Usuario validado:", user);
    next();
}



//LOGIN

app.post('/api/login', async (req, res)  => { //define la ruta POST, para solicitud de inicio de sesion
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

 app.get("/api/todos", validateMiddleware, (req, res) => {
    res.contentType('application/json');  

    const lista = todos.map(element => ({   //mapea cada elemento en la lista todos  y agrega las propiedades en la  a la lista
        id: element.id,
        title: element.title,
        completed: element.completed
    }));

    res.status(200).send(lista);  //codigo de estado como 200 y envia la lista en formato json
});

// OBTENER ITEMS

app.get("/api/todos/:id", validateMiddleware, (req, res) => {
    res.contentType('application/json');  

    const id = req.params.id;  // Obtener el ID de los parámetros de la URL

    const todo = todos.find((element) => element.id === id);  // Buscar el ítem con el ID especificado en la lista de tareas

    if (!todo) {  // Si no se encuentra el ítem, devolver un mensaje de error y un código de estado 404
        return res.status(404).send("Item no encontrado");
    }

    res.status(200).send(todo);  // Devolver el ítem encontrado con código de estado 200
});
  
// CREACION DE ITEM

// Ruta para crear un nuevo ítem
app.post("/api/todos", validateMiddleware, (req, res) => {
    res.contentType('application/json');  

    const { title, completed } = req.body;  // Obtener el título y el estado completado del cuerpo de la solicitud

    if (!title) {  // Verificar si el título no se proporcionó correctamente
        return res.status(400).send('El título es obligatorio');
    }

    // Crear un nuevo ítem con un ID único
    const newTodo = {
        id: randomUUID(),
        title: title,
        completed: completed || false  // Establecer el estado completado como false si no se proporciona
    };

    todos.push(newTodo);  // Agregar el nuevo ítem a la lista de tareas

    res.status(201).send(newTodo);  // Devolver el nuevo ítem creado con un código de estado 201 (Creado)
});

// ACTUALIZACION DE ITEM

// Ruta para actualizar un ítem
app.put("/api/todos/:id", validateMiddleware, (req, res) => {
    res.contentType('application/json');  

    const id = req.params.id;  // Obtener el ID del ítem a actualizar de los parámetros de la URL
    const { title, completed } = req.body;  // Obtener el nuevo título y estado completado del cuerpo de la solicitud

    // Verificar si el título no está en el formato correcto (por ejemplo, si no es una cadena de texto)
    if (title !== undefined && typeof title !== 'string') {
        return res.status(400).send('El título debe ser una cadena de texto');
    }

    // Verificar si el estado completado no está en el formato correcto (por ejemplo, si no es un booleano)
    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).send('El estado completado debe ser un booleano');
    }

    const todoIndex = todos.findIndex((element) => element.id === id);  // Buscar el ítem en la lista de tareas

    if (todoIndex === -1) {  // Si no se encuentra el ítem, devolver un mensaje de error y un código de estado 404
        return res.status(404).send("Item no encontrado");
    }

    // Actualizar el ítem con los nuevos datos
    todos[todoIndex] = {
        ...todos[todoIndex],
        title: title || todos[todoIndex].title,  // Mantener el título original si no se proporciona un nuevo título
        completed: completed !== undefined ? completed : todos[todoIndex].completed  // Mantener el estado completado original si no se proporciona un nuevo estado
    };

    res.status(200).send(todos[todoIndex]);  // Devolver el ítem actualizado con un código de estado 200
});

// BORRAR ITEM

app.delete("/api/todos/:id", validateMiddleware, (req, res) => {
    res.contentType('application/json');  

    const id = req.params.id;  // Obtener el ID del ítem a eliminar de los parámetros de la URL

    const todoIndex = todos.findIndex((element) => element.id === id);  // Buscar el ítem en la lista de tareas

    if (todoIndex === -1) {  // Si no se encuentra el ítem, devolver un mensaje de error y un código de estado 404
        return res.status(404).send("Item no encontrado");
    }

    // Eliminar el ítem de la lista de tareas
    todos.splice(todoIndex, 1);

    res.status(204).send();  // Devolver una respuesta vacía con un código de estado 204 (Sin contenido)
});



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


