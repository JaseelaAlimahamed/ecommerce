const form =document.querySelector('#form')
const username= form.querySelector('#username')
const password = form.querySelector('#password') 
const cpassword=form.querySelector('#cpassword')
const email=form.querySelector('#email')
const errorElement =document.querySelector('#error')

function hideErrorMessage(){
    errorElement.innerHTML = ""
    
}
function showErrorMessage(message){
    errorElement.innerHTML= `<div class="alert bg-dark outline-none" role="alert"> ${message}</div>`
}
function submitform(e){
   
    if(username.value==="" && password.value==="" &&email.value===""){
        showErrorMessage("Email , Username and Password is mandatory")
        return false;
    }
    if(email.value===""){
        showErrorMessage("Email is Required")
        return false;
    }
    if(username.value===""){
        showErrorMessage("Username is Required")
        return false;
    }
    if(password.value===""){
        showErrorMessage(" Password is Required")
        return false;
    }
    if(password.value.length <7 || password.value.length >11){
        showErrorMessage("Password size should between 7- 10 letters")
        return false;
    }
    if(password.value !== cpassword.value){
        
        showErrorMessage("Confirm password should be same as Password")
        return false;
    }
    if(password.value === "password"){
        showErrorMessage("Password cannot be password")
        return false;
    }
    hideErrorMessage()
    return true;
}