import { useParams } from "react-router";
import PersonForm from "./PersonForm.jsx";
export default function EditUser() { const { id } = useParams(); return <PersonForm mode="edit" userId={id} />; }
