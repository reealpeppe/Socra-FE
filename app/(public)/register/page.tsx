import {RegistrationForm} from "@/components/RegistrationForm";
import {PrelaunchAuthBoundary} from "@/components/PrelaunchAuthBoundary";
export default function Page(){return <PrelaunchAuthBoundary mode="register"><RegistrationForm/></PrelaunchAuthBoundary>;}
