// Campos del formulario
const mascotaInput = document.querySelector('#mascota');
const propietarioInput = document.querySelector('#propietario');
const telefonoInput = document.querySelector('#telefono');
const fechaInput = document.querySelector('#fecha');
const horaInput = document.querySelector('#hora');
const sintomasInput = document.querySelector('#sintomas');
let DB;

// UI
const formulario = document.querySelector('#nueva-cita');
const contenedorCitas = document.querySelector('#citas');

let editando = false;

window.onload = () => {
    eventListeners();
    crearDB();
}

// Registrar eventos
function eventListeners(){
    /*
	* change sirve para cuando dejamos de hacer cambios
	* input sirve para camputar cada caracter en el input mientras se van realizando cambios
	*/
    mascotaInput.addEventListener('change', datosCita);
    propietarioInput.addEventListener('change', datosCita);
    telefonoInput.addEventListener('change', datosCita);
    fechaInput.addEventListener('change', datosCita);
    horaInput.addEventListener('change', datosCita);
    sintomasInput.addEventListener('change', datosCita);

    formulario.addEventListener('submit', nuevaCita);
}

// Clases
class Citas {
    constructor(){
        this.citas = [];
    }

    agregarCita(cita){
        this.citas = [...this.citas, cita];
    }

    editarCita(citaActualizada){
        this.citas = this.citas.map(cita => cita.id === citaActualizada.id ? citaActualizada : cita);
    }

    aliminarCita(id){
        this.citas = this.citas.filter(cita => cita.id !== id);
    }
}

class UI {
    mostrarMensaje(mensaje, tipo){
        // Creamos un div
        const divMensaje = document.createElement('div');
        divMensaje.classList.add('text-center', 'alert', 'd-block', 'col-12');

        // Agregar clase dependiendo del tipo
        if (tipo === 'error') {
            divMensaje.classList.add('alert-danger');
        } else {
            divMensaje.classList.add('alert-success');
        }

        // Agregamos el mensaje
        divMensaje.textContent = mensaje;

        // Agregamos al DOM
        document.querySelector('#contenido').insertBefore(divMensaje, document.querySelector('.agregar-cita'));

        // Quitar la alerta despues de 5s
        setTimeout(()=>{
            divMensaje.remove();
        }, 5000 );
    }

    imprimirCitas(){ // Aplicando desestructuración desde los parametros

        this.limpiarHTML();

        // Leer el contenido de la base de datos
        const objectStore = DB.transaction('citas').objectStore('citas');
        objectStore.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor){
                const {mascota, propietario, telefono, fecha, hora, sintomas, id} = cursor.value;
                const divCita = document.createElement('div');
                divCita.classList.add('cita', 'p-3');
                divCita.dataset.id = id;

                // Scripting de los elemtos de la cita
                const mascotaParrafo = document.createElement('h2');
                mascotaParrafo.classList.add('card-title', 'font-weight-bolder');
                mascotaParrafo.textContent = mascota;

                const propietarioParrafo = document.createElement('p');
                propietarioParrafo.innerHTML = `<span class="font-weight-bolder">Propietario: ${propietario}</span>`;

                const telefonoParrafo = document.createElement('p');
                telefonoParrafo.innerHTML = `<span class="font-weight-bolder">telefono: ${telefono}</span>`;

                const fechaParrafo = document.createElement('p');
                fechaParrafo.innerHTML = `<span class="font-weight-bolder">fecha: ${fecha}</span>`;

                const horaParrafo = document.createElement('p');
                horaParrafo.innerHTML = `<span class="font-weight-bolder">hora: ${hora}</span>`;

                const sintomasParrafo = document.createElement('p');
                sintomasParrafo.innerHTML = `<span class="font-weight-bolder">sintomas: ${sintomas}</span>`;

                // Botòn de eliminar citas
                const btnRemove = document.createElement('button');
                btnRemove.classList.add('btn', 'btn-danger', 'mr-2');
                btnRemove.innerHTML = 'Eliminar';
                btnRemove.onclick = () => borrarCita(id);

                // Botòn de editar cita
                const btnEdita = document.createElement('button');
                const cita = cursor.value;
                btnEdita.onclick = () => editCita(cita); // Le pasamos todos los datos de la cita
                btnEdita.classList.add('btn', 'btn-primary', 'mr-2');
                btnEdita.innerHTML = 'Editar';

                // Agregar parrafo a divCita
                divCita.appendChild(mascotaParrafo);
                divCita.appendChild(propietarioParrafo);
                divCita.appendChild(telefonoParrafo);
                divCita.appendChild(fechaParrafo);
                divCita.appendChild(horaParrafo);
                divCita.appendChild(sintomasParrafo);
                divCita.appendChild(btnRemove);
                divCita.appendChild(btnEdita);

                // Agregar las citas al HTML
                contenedorCitas.appendChild(divCita);

                // Imprimir el siguiente elemento de IndexDB
                cursor.continue();
            }
        }
    }

    limpiarHTML(){
        while (contenedorCitas.firstChild) {
            contenedorCitas.removeChild(contenedorCitas.firstChild)
        }
    }
}

const ui = new UI();
const administrarCitas = new Citas();

// Objeto con informaciòn de la cita
const citaObj = {
    mascota : '',
    propietario : '',
    telefono : '',
    fecha : '',
    hora : '',
    sintomas : '',
}

// Agrega datos al objeto de cita
function datosCita(event){
    citaObj[event.target.name] = event.target.value;
}

// Se validan y agrega una nueva cita a la clase de citas
function nuevaCita(event){
    event.preventDefault();

    // Extraemos la informacion del objeto de citaObj
    const {mascota, propietario, telefono, fecha, hora, sintomas} = citaObj;

    // Validar campos
    if (mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === '') {
        ui.mostrarMensaje('Todos los campos son obligatorios', 'error');
        return;
    }

    if(editando){
        // Imprimimos un mensaje
        ui.mostrarMensaje('Se editò correctamente', 'success');

        // Pasar el objeto de la cita a edicion
        administrarCitas.editarCita({...citaObj});

        // Editando desde IndexDB
        const transaction = DB.transaction(['citas'], 'readwrite');
        const objectStore = transaction.objectStore('citas');
        objectStore.put(citaObj);

        transaction.oncomplete = () => {
            // Cambiar el texto del botòn
            formulario.querySelector('button[type="submit"]').textContent = 'Crear cita';

            editando = false;
        }

        transaction.onerror = () => {

        }

    } else {
        // Generar un ID unico
        citaObj.id = Date.now();

        // Creando una nueva cita
        administrarCitas.agregarCita({...citaObj}); // Le pasamos una copia, no el objeto

        // Insetar registro en indexDB
        const transaction = DB.transaction(['citas'], 'readwrite');
        // Habilitar el objectStore
        const objectStore = transaction.objectStore('citas');
        // Insertar en la BD
        objectStore.add(citaObj);

        transaction.oncomplete = function () {
            console.log('Cita agregada');
        }

        // Imprimimos un mensaje
        ui.mostrarMensaje('Se agregò correctamente', 'success');
    }

    // Mostrar el HTML
    ui.imprimirCitas();

    // Reiniciamos el objeto para la validacion
    reiniciarObjeto();

    // Reiniciar el formulario
    formulario.reset();
}

// Reiniciar objeto
function reiniciarObjeto(){
    citaObj.mascota = '';
    citaObj.propietario = '';
    citaObj.telefono = '';
    citaObj.fecha = '';
    citaObj.hora = '';
    citaObj.sintomas = '';
}

// Eliminar cita
function borrarCita(id){
    // Eliminar cita
    const transaction = DB.transaction(['citas'], 'readwrite');
    const objectStore = transaction.objectStore('citas');
    objectStore.delete(id);

    transaction.oncomplete = () => {
        // Mostrar el mensaje
        ui.mostrarMensaje(`La cita ${id} fue eliminada con exito`);

        // Actualizar
        ui.imprimirCitas();
    }

    transaction.onerror = () => {
        console.log('Hubo un error');
    }
}

// Cargar los datos y editar
function editCita(cita){
    const {mascota, propietario, telefono, fecha, hora, sintomas, id} = cita;

    // Llenar los inputs
    mascotaInput.value = mascota;
    propietarioInput.value = propietario;
    telefonoInput.value = telefono;
    fechaInput.value = fecha;
    horaInput.value = hora;
    sintomasInput.value = sintomas;

    // Llenar el objeto
    citaObj.mascota = mascota;
    citaObj.propietario = propietario;
    citaObj.telefono = telefono;
    citaObj.fecha = fecha;
    citaObj.hora = hora;
    citaObj.sintomas = sintomas;
    citaObj.id = id;

    // Cambiar el texto del botòn
    formulario.querySelector('button[type="submit"]').textContent = 'Actualizar cita';

    editando = true;
}


function crearDB() {
    // crear la base de datos v1.0
    const crearDB = window.indexedDB.open('citas', 1);

    // Si tenemos un error
    crearDB.onerror = function () {
        console.log('Ocurrio un error');
    }

    // si tenemos exito
    crearDB.onsuccess = function () {
        console.log('Base de datos creada');
        DB = crearDB.result;

        // Mostrar citas al cargar
        ui.imprimirCitas();
    }

    // Definir el schema
    crearDB.onupgradeneeded = function (event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore('citas', {
           keyPath: 'id',
            autoIncrement: true,
        });

        // Definir las columnas
        objectStore.createIndex('mascota', 'mascota', {unique: false});
        objectStore.createIndex('propietario', 'propietario', {unique: false});
        objectStore.createIndex('telefono', 'telefono', {unique: false});
        objectStore.createIndex('fecha', 'fecha', {unique: false});
        objectStore.createIndex('hora', 'hora', {unique: false});
        objectStore.createIndex('sintomas', 'sintomas', {unique: false});
        objectStore.createIndex('id', 'id', {unique: true});

        console.log('BD creada y lista');

    }
}