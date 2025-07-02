
CREATE TABLE [admins] (
    [admin_id] NVARCHAR(200) NOT NULL,
    [password] NVARCHAR(200) NOT NULL,
    CONSTRAINT [PK_admins] PRIMARY KEY CLUSTERED ([admin_id])
);

CREATE TABLE [security_questions] (
    [security_question_id] INT IDENTITY(1,1) NOT NULL,
    [question] NVARCHAR(500) NOT NULL,
    CONSTRAINT [PK_security_questions] PRIMARY KEY CLUSTERED ([security_question_id])
);

CREATE TABLE [medical_questions] (
    [medical_question_id] INT IDENTITY(1,1) NOT NULL,
    [question] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [PK_medical_questions] PRIMARY KEY CLUSTERED ([medical_question_id])
);

CREATE TABLE [service_types] (
    [service_type_id] INT IDENTITY(1,1) NOT NULL,
    [service_type] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_service_types] PRIMARY KEY CLUSTERED ([service_type_id])
);

CREATE TABLE [email_verifications] (
    [email] NVARCHAR(255) NOT NULL,
    [code] NVARCHAR(10) NOT NULL,
    CONSTRAINT [PK_email_verifications] PRIMARY KEY CLUSTERED ([email])
);

CREATE TABLE [reports] (
    [report_id] INT IDENTITY(1,1) NOT NULL,
    [status] NVARCHAR(50) NOT NULL,
    [report_file_url] NVARCHAR(1000) NULL,
    CONSTRAINT [PK_reports] PRIMARY KEY CLUSTERED ([report_id])
);

CREATE TABLE [patients] (
    [patient_id] NVARCHAR(50) NOT NULL,
    [hospital_patient_id] NVARCHAR(50) NULL,
    [password] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [profile_picture] NVARCHAR(500) NULL,
    [email] NVARCHAR(255) NOT NULL,
    [phone_number] NVARCHAR(20) NULL,
    [address] NVARCHAR(500) NULL,
    [nic] NVARCHAR(20) NULL,
    [blood_group] NVARCHAR(10) NULL,
    [date_of_birth] DATETIME2 NULL,
    [gender] NVARCHAR(10) NULL,
    CONSTRAINT [PK_patients] PRIMARY KEY CLUSTERED ([patient_id]),
    CONSTRAINT [UQ_patients_email] UNIQUE ([email]),
    CONSTRAINT [UQ_patients_nic] UNIQUE ([nic])
);

CREATE TABLE [dentists] (
    [dentist_id] NVARCHAR(50) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [profile_picture] NVARCHAR(500) NULL,
    [email] NVARCHAR(255) NOT NULL,
    [phone_number] NVARCHAR(20) NULL,
    [language] NVARCHAR(50) NULL,
    [service_types] NVARCHAR(500) NULL,
    [work_days_from] NVARCHAR(20) NULL,
    [work_days_to] NVARCHAR(20) NULL,
    [work_time_from] NVARCHAR(10) NULL,
    [work_time_to] NVARCHAR(10) NULL,
    [appointment_duration] NVARCHAR(10) NULL,
    [appointment_fee] DECIMAL(10,2) NULL,
    CONSTRAINT [PK_dentists] PRIMARY KEY CLUSTERED ([dentist_id]),
    CONSTRAINT [UQ_dentists_email] UNIQUE ([email])
);

CREATE TABLE [receptionists] (
    [receptionist_id] NVARCHAR(50) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [phone_number] NVARCHAR(20) NULL,
    CONSTRAINT [PK_receptionists] PRIMARY KEY CLUSTERED ([receptionist_id]),
    CONSTRAINT [UQ_receptionists_email] UNIQUE ([email])
);

CREATE TABLE [radiologists] (
    [radiologist_id] NVARCHAR(50) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [profile_picture] NVARCHAR(500) NULL,
    [email] NVARCHAR(255) NOT NULL,
    [phone_number] NVARCHAR(20) NULL,
    CONSTRAINT [PK_radiologists] PRIMARY KEY CLUSTERED ([radiologist_id]),
    CONSTRAINT [UQ_radiologists_email] UNIQUE ([email])
);

-- 3. Create dependent tables
CREATE TABLE [emergency_contacts] (
    [emergency_contact_id] INT IDENTITY(1,1) NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [relationship] NVARCHAR(100) NULL,
    [contact_number] NVARCHAR(20) NOT NULL,
    [patient_id] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_emergency_contacts] PRIMARY KEY CLUSTERED ([emergency_contact_id]),
    CONSTRAINT [UQ_emergency_contacts_patient_id] UNIQUE ([patient_id]),
    CONSTRAINT [FK_emergency_contacts_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE
);

CREATE TABLE [insurance_details] (
    [provider_name] NVARCHAR(255) NULL,
    [policy_number] NVARCHAR(100) NULL,
    [patient_id] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_insurance_details] PRIMARY KEY CLUSTERED ([patient_id]),
    CONSTRAINT [FK_insurance_details_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE
);

CREATE TABLE [appointments] (
    [appointment_id] INT IDENTITY(1,1) NOT NULL,
    [patient_id] NVARCHAR(50) NULL,
    [dentist_id] NVARCHAR(50) NULL,
    [date] DATETIME2 NOT NULL,
    [time_from] NVARCHAR(10) NOT NULL,
    [time_to] NVARCHAR(10) NOT NULL,
    [fee] DECIMAL(10,2) NULL,
    [note] NVARCHAR(1000) NULL,
    [status] NVARCHAR(50) NULL,
    [payment_status] NVARCHAR(50) NULL,
    CONSTRAINT [PK_appointments] PRIMARY KEY CLUSTERED ([appointment_id]),
    CONSTRAINT [FK_appointments_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE SET NULL,
    CONSTRAINT [FK_appointments_dentist_id] FOREIGN KEY ([dentist_id]) REFERENCES [dentists]([dentist_id]) ON DELETE SET NULL
);

CREATE TABLE [appointment_history] (
    [appointment_history_id] INT IDENTITY(1,1) NOT NULL,
    [patient_id] NVARCHAR(50) NOT NULL,
    [dentist_id] NVARCHAR(50) NOT NULL,
    [date] DATETIME2 NULL,
    [time_from] NVARCHAR(10) NULL,
    [time_to] NVARCHAR(10) NULL,
    [fee] DECIMAL(10,2) NULL,
    [note] NVARCHAR(1000) NULL,
    CONSTRAINT [PK_appointment_history] PRIMARY KEY CLUSTERED ([appointment_history_id]),
    CONSTRAINT [FK_appointment_history_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_appointment_history_dentist_id] FOREIGN KEY ([dentist_id]) REFERENCES [dentists]([dentist_id]) ON DELETE CASCADE
);

CREATE TABLE [soap_notes] (
    [note_id] INT IDENTITY(1,1) NOT NULL,
    [dentist_id] NVARCHAR(50) NOT NULL,
    [patient_id] NVARCHAR(50) NOT NULL,
    [note] NVARCHAR(4000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    CONSTRAINT [PK_soap_notes] PRIMARY KEY CLUSTERED ([note_id]),
    CONSTRAINT [FK_soap_notes_dentist_id] FOREIGN KEY ([dentist_id]) REFERENCES [dentists]([dentist_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_soap_notes_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE
);

CREATE TABLE [payment_history] (
    [appointment_id] INT NOT NULL,
    [payment_date] NVARCHAR(10) NULL,
    [payment_time] NVARCHAR(10) NULL,
    [reference_number] NVARCHAR(100) NULL,
    CONSTRAINT [PK_payment_history] PRIMARY KEY CLUSTERED ([appointment_id]),
    CONSTRAINT [FK_payment_history_appointment_id] FOREIGN KEY ([appointment_id]) REFERENCES [appointments]([appointment_id]) ON DELETE CASCADE
);

CREATE TABLE [blocked_dates] (
    [blocked_date_id] INT IDENTITY(1,1) NOT NULL,
    [dentist_id] NVARCHAR(50) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [time_from] NVARCHAR(10) NULL,
    [time_to] NVARCHAR(10) NULL,
    CONSTRAINT [PK_blocked_dates] PRIMARY KEY CLUSTERED ([blocked_date_id]),
    CONSTRAINT [FK_blocked_dates_dentist_id] FOREIGN KEY ([dentist_id]) REFERENCES [dentists]([dentist_id]) ON DELETE CASCADE
);

CREATE TABLE [medical_reports] (
    [report_id] INT IDENTITY(1,1) NOT NULL,
    [patient_id] NVARCHAR(50) NOT NULL,
    [record_url] NVARCHAR(1000) NOT NULL,
    [record_name] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK_medical_reports] PRIMARY KEY CLUSTERED ([report_id]),
    CONSTRAINT [FK_medical_reports_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE
);

CREATE TABLE [medical_history] (
    [patient_id] NVARCHAR(50) NOT NULL,
    [medical_question_id] INT NOT NULL,
    [medical_question_answer] NVARCHAR(1000) NULL,
    CONSTRAINT [PK_medical_history] PRIMARY KEY CLUSTERED ([patient_id], [medical_question_id]),
    CONSTRAINT [FK_medical_history_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_medical_history_medical_question_id] FOREIGN KEY ([medical_question_id]) REFERENCES [medical_questions]([medical_question_id]) ON DELETE CASCADE
);

CREATE TABLE [study] (
    [study_id] INT IDENTITY(1,1) NOT NULL,
    [patient_id] NVARCHAR(50) NOT NULL,
    [radiologist_id] NVARCHAR(50) NULL,
    [date] DATETIME2 NOT NULL,
    [time] NVARCHAR(10) NOT NULL,
    [modality] NVARCHAR(100) NULL,
    [report_id] INT NULL,
    [assertion_number] INT NULL,
    [description] NVARCHAR(1000) NULL,
    [source] NVARCHAR(255) NULL,
    [isurgent] BIT NOT NULL DEFAULT 0,
    [dicom_file_url] NVARCHAR(1000) NULL,
    [body_part] NVARCHAR(100) NULL,
    [reason] NVARCHAR(500) NULL,
    [status] NVARCHAR(50) NULL,
    CONSTRAINT [PK_study] PRIMARY KEY CLUSTERED ([study_id]),
    CONSTRAINT [FK_study_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_study_radiologist_id] FOREIGN KEY ([radiologist_id]) REFERENCES [radiologists]([radiologist_id]) ON DELETE SET NULL,
    CONSTRAINT [FK_study_report_id] FOREIGN KEY ([report_id]) REFERENCES [reports]([report_id]) ON DELETE SET NULL
);

CREATE TABLE [patient_security_question_answers] (
    [patient_id] NVARCHAR(50) NOT NULL,
    [security_question_id] INT NOT NULL,
    [answer] NVARCHAR(500) NOT NULL,
    CONSTRAINT [PK_patient_security_question_answers] PRIMARY KEY CLUSTERED ([patient_id], [security_question_id]),
    CONSTRAINT [FK_patient_security_question_answers_patient_id] FOREIGN KEY ([patient_id]) REFERENCES [patients]([patient_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_patient_security_question_answers_security_question_id] FOREIGN KEY ([security_question_id]) REFERENCES [security_questions]([security_question_id]) ON DELETE CASCADE
);

CREATE TABLE [dentist_security_question_answers] (
    [dentist_id] NVARCHAR(50) NOT NULL,
    [security_question_id] INT NOT NULL,
    [answer] NVARCHAR(500) NOT NULL,
    CONSTRAINT [PK_dentist_security_question_answers] PRIMARY KEY CLUSTERED ([dentist_id], [security_question_id]),
    CONSTRAINT [FK_dentist_security_question_answers_dentist_id] FOREIGN KEY ([dentist_id]) REFERENCES [dentists]([dentist_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_dentist_security_question_answers_security_question_id] FOREIGN KEY ([security_question_id]) REFERENCES [security_questions]([security_question_id]) ON DELETE CASCADE
);

CREATE TABLE [receptionist_security_question_answers] (
    [receptionist_id] NVARCHAR(50) NOT NULL,
    [security_question_id] INT NOT NULL,
    [answer] NVARCHAR(500) NOT NULL,
    CONSTRAINT [PK_receptionist_security_question_answers] PRIMARY KEY CLUSTERED ([receptionist_id], [security_question_id]),
    CONSTRAINT [FK_receptionist_security_question_answers_receptionist_id] FOREIGN KEY ([receptionist_id]) REFERENCES [receptionists]([receptionist_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_receptionist_security_question_answers_security_question_id] FOREIGN KEY ([security_question_id]) REFERENCES [security_questions]([security_question_id]) ON DELETE CASCADE
);

CREATE TABLE [radiologist_security_question_answers] (
    [radiologist_id] NVARCHAR(50) NOT NULL,
    [security_question_id] INT NOT NULL,
    [answer] NVARCHAR(500) NOT NULL,
    CONSTRAINT [PK_radiologist_security_question_answers] PRIMARY KEY CLUSTERED ([radiologist_id], [security_question_id]),
    CONSTRAINT [FK_radiologist_security_question_answers_radiologist_id] FOREIGN KEY ([radiologist_id]) REFERENCES [radiologists]([radiologist_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_radiologist_security_question_answers_security_question_id] FOREIGN KEY ([security_question_id]) REFERENCES [security_questions]([security_question_id]) ON DELETE CASCADE
);

CREATE TABLE [dentist_assign] (
    [study_id] INT NOT NULL,
    [dentist_id] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_dentist_assign] PRIMARY KEY CLUSTERED ([study_id], [dentist_id]),
    CONSTRAINT [FK_dentist_assign_study_id] FOREIGN KEY ([study_id]) REFERENCES [study]([study_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_dentist_assign_dentist_id] FOREIGN KEY ([dentist_id]) REFERENCES [dentists]([dentist_id]) ON DELETE CASCADE
);

-- 6. Create indexes for performance
CREATE NONCLUSTERED INDEX [IX_patients_email] ON [patients] ([email]);
CREATE NONCLUSTERED INDEX [IX_patients_nic] ON [patients] ([nic]);

CREATE NONCLUSTERED INDEX [IX_dentists_email] ON [dentists] ([email]);

CREATE NONCLUSTERED INDEX [IX_receptionists_email] ON [receptionists] ([email]);

CREATE NONCLUSTERED INDEX [IX_radiologists_email] ON [radiologists] ([email]);

CREATE NONCLUSTERED INDEX [IX_appointments_date] ON [appointments] ([date]);
CREATE NONCLUSTERED INDEX [IX_appointments_patient_id] ON [appointments] ([patient_id]);
CREATE NONCLUSTERED INDEX [IX_appointments_dentist_id] ON [appointments] ([dentist_id]);

CREATE NONCLUSTERED INDEX [IX_appointment_history_patient_id] ON [appointment_history] ([patient_id]);
CREATE NONCLUSTERED INDEX [IX_appointment_history_dentist_id] ON [appointment_history] ([dentist_id]);

CREATE NONCLUSTERED INDEX [IX_soap_notes_patient_id] ON [soap_notes] ([patient_id]);
CREATE NONCLUSTERED INDEX [IX_soap_notes_dentist_id] ON [soap_notes] ([dentist_id]);
CREATE NONCLUSTERED INDEX [IX_soap_notes_date] ON [soap_notes] ([date]);

CREATE NONCLUSTERED INDEX [IX_blocked_dates_dentist_id] ON [blocked_dates] ([dentist_id]);
CREATE NONCLUSTERED INDEX [IX_blocked_dates_date] ON [blocked_dates] ([date]);

CREATE NONCLUSTERED INDEX [IX_medical_reports_patient_id] ON [medical_reports] ([patient_id]);

CREATE NONCLUSTERED INDEX [IX_study_patient_id] ON [study] ([patient_id]);
CREATE NONCLUSTERED INDEX [IX_study_radiologist_id] ON [study] ([radiologist_id]);
CREATE NONCLUSTERED INDEX [IX_study_date] ON [study] ([date]);
