export interface User {
    _id:string;
    email:string;
    password:string;
    firstName:string;
    lastName:string;
    dateOfBirth:Date;
    role:'user'|'admin';
    createdAt:Date;
    updatedAt:Date;
    isVerified:boolean;
}
