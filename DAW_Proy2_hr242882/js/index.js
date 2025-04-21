document.body.style.fontFamily = 'Arial, sans-serif';
const app = document.getElementById('app');

let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let prestamos = JSON.parse(localStorage.getItem('prestamos')) || [];

function guardarDatos() {
    localStorage.setItem('clientes', JSON.stringify(clientes));
    localStorage.setItem('prestamos', JSON.stringify(prestamos));
}

function sumarDiasHabiles(fecha, diasHabiles) {
    let contador = 0;
    let nuevaFecha = new Date(fecha);
    while (contador < diasHabiles) {
        nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        const dia = nuevaFecha.getDay();
        if (dia !== 0 && dia !== 6) contador++;
    }
    return nuevaFecha;
}

function revisarAlertas() {
    const hoy = new Date();
    prestamos.forEach(prestamo => {
        const venc = new Date(prestamo.fechaVencimiento);
        const diff = (venc - hoy) / (1000 * 60 * 60 * 24);
        if (diff <= 2 && diff > 0 && !prestamo.pagado) {
            alert(`¡Atención! El préstamo de ${prestamo.nombreCliente} vence pronto (${venc.toLocaleDateString()})`);
        }
    });
}

function renderFormularioCliente() {
    app.innerHTML = `
  <div class="flex-horizontal">
    <div class="card small-card">
      <h2>Registro de Cliente</h2>
      <input placeholder="Nombre" id="nombre">
      <input placeholder="DUI" id="dui">
      <input placeholder="Teléfono" id="telefono">
      <input placeholder="Correo" id="correo">
      <button onclick="registrarCliente()">Registrar Cliente</button>
    </div>

    <div class="card small-card">
      <h2>Registrar Préstamo</h2>
      <select id="clienteSelect">
        ${clientes.map(c => `<option value="${c.dui}">${c.nombre}</option>`).join('')}
      </select>
      <input placeholder="Monto" type="number" id="monto">
      <input type="date" id="fechaInicio">
      <button onclick="registrarPrestamo()">Registrar Préstamo</button>
    </div>
  </div>

  <div class="card">
    <h2>Historial de Préstamos</h2>
    <div id="historial"></div>
  </div>

  <div class="card">
    <h2>Buscar por Fecha</h2>
    <input type="date" id="buscarFecha">
    <button onclick="buscarPorFecha()">Buscar</button>
    <div id="resultadoFecha"></div>
  </div>

  <div class="card">
    <h2>Buscar por Nombre</h2>
    <input type="text" id="buscarNombre" placeholder="Ej: Juan Pérez">
    <button onclick="buscarPorNombre()">Buscar</button>
    <div id="resultadoNombre"></div>
  </div>

  <div class="card">
    <h2>Eliminar Cliente</h2>
    <div id="listaClientes">
      ${clientes.map((c, i) => `
        <div style="margin-bottom:5px">
          ${c.nombre} (${c.dui})
          <button onclick="eliminarCliente(${i})">Eliminar</button>
        </div>
      `).join('')}
    </div>
  </div>
`;
    renderHistorial();
}

function registrarCliente() {
    const nombre = document.getElementById('nombre').value;
    const dui = document.getElementById('dui').value;
    const telefono = document.getElementById('telefono').value;
    const correo = document.getElementById('correo').value;

    if (!nombre || !dui || !telefono || !correo) {
        alert("Completa todos los campos.");
        return;
    }

    if (clientes.some(c => c.dui === dui)) {
        alert("Este cliente ya está registrado.");
        return;
    }

    clientes.push({ nombre, dui, telefono, correo });
    guardarDatos();
    alert("Cliente registrado correctamente.");
    renderFormularioCliente();
}

function registrarPrestamo() {
    const dui = document.getElementById('clienteSelect').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const fechaInicio = new Date(document.getElementById('fechaInicio').value);

    if (prestamos.some(p => p.dui === dui && !p.pagado)) {
        alert("Este cliente ya tiene un préstamo activo.");
        return;
    }

    if (isNaN(monto) || monto <= 0 || !fechaInicio) {
        alert("Verifica los datos del préstamo.");
        return;
    }

    const cliente = clientes.find(c => c.dui === dui);
    const interes = monto * 0.03;
    const total = monto + interes;
    const fechaVencimiento = sumarDiasHabiles(fechaInicio, 20);

    prestamos.push({
        nombreCliente: cliente.nombre,
        dui,
        monto,
        interes,
        total,
        fechaInicio,
        fechaVencimiento,
        pagado: false
    });

    guardarDatos();
    alert("Préstamo registrado con éxito.");
    renderFormularioCliente();
}

function renderHistorial() {
    const historial = document.getElementById('historial');
    historial.innerHTML = prestamos.map((p, index) => `
    <div style="border:1px solid #ccc; padding:10px; margin:10px;">
      <strong>${p.nombreCliente}</strong><br>
      Monto: $${p.monto}<br>
      Interés: $${p.interes}<br>
      Total a pagar: $${p.total}<br>
      Fecha de inicio: ${new Date(p.fechaInicio).toLocaleDateString()}<br>
      Fecha de vencimiento: ${new Date(p.fechaVencimiento).toLocaleDateString()}<br>
      Estado: <strong style="color:${p.pagado ? 'green' : 'red'}">${p.pagado ? "Pagado" : "Activo"}</strong><br>
      ${!p.pagado ? `<button onclick="marcarPagado(${index})">Marcar como Pagado</button>` : ""}
    </div>
  `).join('');
}

function marcarPagado(index) {
    prestamos[index].pagado = true;
    guardarDatos();
    renderFormularioCliente();
}

function buscarPorFecha() {
    const fechaBuscar = new Date(document.getElementById('buscarFecha').value);
    const resultado = prestamos.filter(p =>
        new Date(p.fechaInicio).toDateString() === fechaBuscar.toDateString()
    );

    const contenedor = document.getElementById('resultadoFecha');
    contenedor.innerHTML = resultado.length
        ? resultado.map(p => `<p>${p.nombreCliente} - $${p.total} (${p.pagado ? "Pagado" : "Activo"})</p>`).join('')
        : "<p>No hay préstamos en esa fecha.</p>";
}

function buscarPorNombre() {
    const nombreBuscar = document.getElementById('buscarNombre').value.toLowerCase();

    if (!nombreBuscar) {
        alert("Ingresa un nombre para buscar.");
        return;
    }

    const resultado = prestamos.filter(p =>
        p.nombreCliente.toLowerCase().includes(nombreBuscar)
    );

    const contenedor = document.getElementById('resultadoNombre');
    contenedor.innerHTML = resultado.length
        ? resultado.map(p => `
          <div style="border:1px solid #ccc; margin:5px; padding:5px;">
            <strong>${p.nombreCliente}</strong><br>
            Monto: $${p.monto} | Total: $${p.total}<br>
            Estado: ${p.pagado ? "Pagado" : "Activo"}<br>
            Fecha de inicio: ${new Date(p.fechaInicio).toLocaleDateString()}
          </div>
        `).join('')
        : "<p>No se encontraron préstamos para ese nombre.</p>";
}


renderFormularioCliente();
setInterval(revisarAlertas, 10000);

function eliminarCliente(index) {
    const cliente = clientes[index];
    const confirmacion = confirm(`¿Estás seguro de eliminar a ${cliente.nombre} y todos sus préstamos?`);

    if (!confirmacion) return;

    clientes.splice(index, 1);

    prestamos = prestamos.filter(p => p.dui !== cliente.dui);

    guardarDatos();
    renderFormularioCliente();
}
