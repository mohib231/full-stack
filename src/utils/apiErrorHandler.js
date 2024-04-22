export class ApiErrorHandler extends Error {
  constructor(statuscode, message = "something went wrong", stack='', errors = []) {
    super(message);
    this.statuscode= statuscode;
    this.errors= errors;
    this.data = null;
    this.message= message;
    this.success= false;

    if(stack){
        this.stack=stack
    }else{
        Error.captureStackTrace(this,this.constructor)
    }
  }
}
