const socket = io();

//dom elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar__template").innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild;

    //height of the new message;
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom); 
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;


    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of the messages container
    const containerHeight = $messages.scrollHeight;

    //how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

// messages sent from input field
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

//location messages
socket.on('locationMessage', (location) => {
    console.log(location);
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.querySelector('input').value;
    $messageFormButton.setAttribute('disabled', true)
    socket.emit('sendMessage', message, (msg) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        console.log(msg);
    });
})

$sendLocationButton.addEventListener('click', (e) => {
   if(!navigator.geolocation){
    return alert('Geo location is not supported by your browser');
   }

   $sendLocationButton.setAttribute('disabled', true)
   navigator.geolocation.getCurrentPosition(position => {
    socket.emit('sendLocation', {
        latitude: position.coords.latitude, 
        longitude: position.coords.longitude
    }, (ackMsg) => {
        $sendLocationButton.removeAttribute('disabled')
        console.log(ackMsg);

    })
   })
   
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error); 
        location.href = '/'
    }
})


//example

/* socket.on('countUpdated', (count) => {
    console.log("Count has been updated..!", count)
})

document.getElementById('increment').addEventListener('click', () => {
    console.log("Clicked");
    socket.emit('increment')
}) */