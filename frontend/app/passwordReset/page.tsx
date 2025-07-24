"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";


type RequestType = {
    userID: string,
    questions: { security_question_id: number, answer: string }[]
}


type Questions = {
    security_question_id: number,
    question: string
}

const PasswordResetPage = () => {
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const [questions, setQuestions] = useState<Questions[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [submittingAnswers, setSubmittingAnswers] = useState(false);
    const [formData, setFormData] = useState<RequestType>({
        userID: '',
        questions: [],
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [passwordValid, setPasswordValid] = useState(false);
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    const validatePassword = (password: string) => {
        const lengthCheck = password.length >= 8;
        const complexityCheck = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
        return lengthCheck && complexityCheck;
    };


    const fetchQuestion = async () => {
        setLoadingQuestions(true);
        try {
            const response = await axios.get(
                `${backendURL}/security-questions`
            );
            if (response.status == 500) {
                throw new Error("Error fetching security questions");
            }
            setQuestions(response.data);
            console.log(response.data);
        }
        catch (error: any) {
            toast.error("Error", { description: error.message });
        }
        finally {
            setLoadingQuestions(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !formData.userID ||
            !formData.questions[0]?.security_question_id ||
            !formData.questions[1]?.security_question_id ||
            !formData.questions[2]?.security_question_id
        ) {
            toast.error("Please select all questions.");
            return;
        }

        if (
            !formData.questions[0]?.answer ||
            !formData.questions[1]?.answer ||
            !formData.questions[2]?.answer
        ) {
            toast.error("Please provide answers for all questions.");
            return;
        }

        setSubmittingAnswers(true);
        try {
            const response = await axios.post(
                `${backendURL}/reset-password`,
                {
                    userID: formData.userID,
                    questions: formData.questions
                },
                {
                    headers: {
                        "content-type": "application/json"
                    }
                }
            );
            if (response.status == 200) {
                setOpenDialog(true);
            }
            if (response.status == 401) {
                throw new Error("Answers don't match");
            }
            if (response.status == 500) {
                throw new Error("Internal Server Error");
            }
        }
        catch (err: any) {
            if (err.response) {
                const { status, data } = err.response;
                if (status === 401) {
                    toast.error("Verification Failed", { description: data.message || "Answers don't match." });
                } else if (status === 500) {
                    toast.error("Server Error", { description: data.error || "Internal Server Error" });
                } else {
                    toast.error("Unexpected Error", { description: data.error || "Something went wrong." });
                }
            } else {
                toast.error("Network Error", { description: err.message || "Unable to connect to server." });
            }
        }

        finally {
            setSubmittingAnswers(false);
        }

    }

    const handlePasswordReset = async () => {
        if (!newPassword || !confirmPassword) {
            setError("Both fields are required.")
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.")
            return;
        }

        if (newPassword.length < 8) {
            setError("Password needs at least 8 characters");
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            setError("Password need to contain special characters");
            return;
        }

        setSubmittingPassword(true);

        try {
            const response = await axios.post(
                `${backendURL}/reset-password/change`, {
                userID: formData.userID,
                password: newPassword
            },
                {
                    headers: {
                        "content-type": "application/json"
                    }
                }
            );
            if (response.status != 200) {
                throw new Error("Error Changing Password");
            }
            toast.success("Password Changed", { description: "You can now log in with your new password" });
            router.push("/");
        } catch (error: any) {
            toast.error("Failed to reset password", {
                description: error.response?.data?.error || error.message,
            });
        } finally {
            setSubmittingPassword(false);
        }
    };

    useEffect(() => {
        fetchQuestion();
    }, [])

    return (
        loadingQuestions ? (
            <div className="flex justify-center items-center h-screen flex-col">
                <Loader className="h-12 w-12 text-emerald-500 animate-spin" />
                <h3 className="mt-4 text-gray-600 text-lg">Loading...</h3>
            </div>
        ) : (
            <>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-white shadow-lg rounded-xl space-y-5">
                        <h2 className="text-2xl font-semibold text-center text-emerald-500">Reset Password</h2>

                        <Input
                            id="userid"
                            required
                            value={formData.userID}
                            onChange={(e) =>
                                setFormData({ ...formData, userID: e.target.value })
                            }
                            className="mt-1"
                            placeholder="Enter Your ID"
                        />

                        {/* Question 01 */}
                        <div className="space-y-2">
                            <Select
                                onValueChange={(value) => {
                                    const updatedQuestions = [...formData.questions];
                                    updatedQuestions[0] = {
                                        ...updatedQuestions[0],
                                        security_question_id: parseInt(value),
                                    };
                                    setFormData({ ...formData, questions: updatedQuestions });
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Question 01" />
                                </SelectTrigger>
                                <SelectContent>
                                    {questions.map((q) => (
                                        <SelectItem key={q.security_question_id} value={q.security_question_id.toString()}>
                                            {q.question}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="answer1"
                                required
                                value={formData.questions[0]?.answer || ''}
                                onChange={(e) => {
                                    const updatedQuestions = [...formData.questions];
                                    updatedQuestions[0] = {
                                        ...updatedQuestions[0],
                                        answer: e.target.value,
                                    };
                                    setFormData({ ...formData, questions: updatedQuestions });
                                }}
                                placeholder="Enter answer for question 01"
                            />
                        </div>

                        {/* Question 02 */}
                        <div className="space-y-2">
                            <Select
                                onValueChange={(value) => {
                                    const updatedQuestions = [...formData.questions];
                                    updatedQuestions[1] = {
                                        ...updatedQuestions[1],
                                        security_question_id: parseInt(value),
                                    };
                                    setFormData({ ...formData, questions: updatedQuestions });
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Question 02" />
                                </SelectTrigger>
                                <SelectContent>
                                    {questions
                                        .filter((q) => q.security_question_id !== formData.questions[0]?.security_question_id)
                                        .map((q) => (
                                            <SelectItem key={q.security_question_id} value={q.security_question_id.toString()}>
                                                {q.question}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="answer2"
                                required
                                value={formData.questions[1]?.answer || ''}
                                onChange={(e) => {
                                    const updatedQuestions = [...formData.questions];
                                    updatedQuestions[1] = {
                                        ...updatedQuestions[1],
                                        answer: e.target.value,
                                    };
                                    setFormData({ ...formData, questions: updatedQuestions });
                                }}
                                placeholder="Enter answer for question 02"
                            />
                        </div>

                        {/* Question 03 */}
                        <div className="space-y-2">
                            <Select
                                onValueChange={(value) => {
                                    const updatedQuestions = [...formData.questions];
                                    updatedQuestions[2] = {
                                        ...updatedQuestions[2],
                                        security_question_id: parseInt(value),
                                    };
                                    setFormData({ ...formData, questions: updatedQuestions });
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Question 03" />
                                </SelectTrigger>
                                <SelectContent>
                                    {questions
                                        .filter(
                                            (q) =>
                                                q.security_question_id !== formData.questions[0]?.security_question_id &&
                                                q.security_question_id !== formData.questions[1]?.security_question_id
                                        )
                                        .map((q) => (
                                            <SelectItem key={q.security_question_id} value={q.security_question_id.toString()}>
                                                {q.question}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="answer3"
                                required
                                value={formData.questions[2]?.answer || ''}
                                onChange={(e) => {
                                    const updatedQuestions = [...formData.questions];
                                    updatedQuestions[2] = {
                                        ...updatedQuestions[2],
                                        answer: e.target.value,
                                    };
                                    setFormData({ ...formData, questions: updatedQuestions });
                                }}
                                placeholder="Enter answer for question 03"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
                            disabled={submittingAnswers}
                        >
                            {submittingAnswers ? <Loader /> : "Submit"}
                        </Button>
                    </form>
                </div>

                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent className="max-w-sm w-full">
                        <DialogHeader>
                            <DialogTitle>Reset Your Password</DialogTitle>
                            <DialogDescription>
                                Enter your new password and confirm it below.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <Input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPassword(val);
                                    setPasswordValid(validatePassword(val));
                                    setPasswordMatch(val === confirmPassword);
                                    setError('');
                                }}
                            />

                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setConfirmPassword(val);
                                    setPasswordMatch(val === newPassword);
                                    setError('');
                                }}
                            />
                        </div>
                        <div className="space-y-1 text-sm">
                            {!passwordValid && newPassword && (
                                <p className="text-red-500">
                                    Password must be at least 8 characters, include uppercase, lowercase, and a number.
                                </p>
                            )}
                            {!passwordMatch && confirmPassword && (
                                <p className="text-red-500">Passwords do not match.</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={handlePasswordReset}
                                disabled={!passwordValid || !passwordMatch || submittingPassword}
                                className="w-full bg-emerald-500 hover:bg-emerald-600"
                            >
                                {submittingPassword ? <Loader className="animate-spin" /> : "Reset Password"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>

        )
    );

}
export default PasswordResetPage;