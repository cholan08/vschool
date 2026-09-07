/**
 * Seed Script — Pediatric Therapy Center
 * ----------------------------------------
 * Run: npm run seed  (from /server directory)
 *
 * Creates:
 *  - 2 Branches
 *  - 1 Clinic Owner
 *  - 2 Branch Admins (1 per branch)
 *  - 4 Therapists (across different departments)
 *  - 2 Parents with 2 children each
 *  - Sample appointments
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import User from './models/User.js';
import Branch from './models/Branch.js';
import Patient from './models/Patient.js';
import Appointment from './models/Appointment.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ─── Wipe existing seed data ────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Branch.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // ─── Create Owner ────────────────────────────────────────────────────────
    const owner = await User.create({
      name: 'Sasikumar',
      email: 'owner@pediatrictherapy.com',
      password: 'password123',
      role: 'owner',
      phone: '+91 98765 00001',
      isActive: true,
    });

    // ─── Create Branches ─────────────────────────────────────────────────────
    const branch1 = await Branch.create({
      name: 'Absolute Special School & Therapy Care — Main',
      code: 'ASST-MAIN',
      address: '42, MG Road, Indiranagar',
      city: 'Bangalore',
      phone: '+91 80 4567 8900',
      email: 'main@pediatrictherapy.com',
      departments: [
        'pediatric_ot', 'speech_language', 'behavioral',
        'sensory_integration', 'psychology',
      ],
      createdBy: owner._id,
    });

    const branch2 = await Branch.create({
      name: 'Absolute Special School & Therapy Care — South',
      code: 'ASST-SOUTH',
      address: '18, 100 Feet Road, JP Nagar',
      city: 'Bangalore',
      phone: '+91 80 4567 8901',
      email: 'south@pediatrictherapy.com',
      departments: [
        'physiotherapy', 'special_education', 'special_school',
        'learning_disabilities', 'vision_therapy',
      ],
      createdBy: owner._id,
    });

    // ─── Create Branch Admins ─────────────────────────────────────────────────
    const admin1 = await User.create({
      name: 'Priya Sharma',
      email: 'admin.main@pediatrictherapy.com',
      password: 'password123',
      role: 'admin',
      branch: branch1._id,
      phone: '+91 98765 00002',
      createdBy: owner._id,
    });

    const admin2 = await User.create({
      name: 'Anita Kumar',
      email: 'admin.south@pediatrictherapy.com',
      password: 'password123',
      role: 'admin',
      branch: branch2._id,
      phone: '+91 98765 00003',
      createdBy: owner._id,
    });

    // ─── Create Therapists ────────────────────────────────────────────────────
    const therapist1 = await User.create({
      name: 'Ms. Deepa Nair',
      email: 'speech@pediatrictherapy.com',
      password: 'password123',
      role: 'therapist',
      branch: branch1._id,
      departments: ['speech_language'],
      phone: '+91 98765 00004',
      createdBy: admin1._id,
    });

    const therapist2 = await User.create({
      name: 'Ms. Kavitha Rao',
      email: 'ot@pediatrictherapy.com',
      password: 'password123',
      role: 'therapist',
      branch: branch1._id,
      departments: ['pediatric_ot', 'sensory_integration'],
      phone: '+91 98765 00005',
      createdBy: admin1._id,
    });

    const therapist3 = await User.create({
      name: 'Mr. Arun Pillai',
      email: 'physio@pediatrictherapy.com',
      password: 'password123',
      role: 'therapist',
      branch: branch2._id,
      departments: ['physiotherapy'],
      phone: '+91 98765 00006',
      createdBy: admin2._id,
    });

    const therapist4 = await User.create({
      name: 'Ms. Sneha Iyer',
      email: 'behavior@pediatrictherapy.com',
      password: 'password123',
      role: 'therapist',
      branch: branch1._id,
      departments: ['behavioral', 'psychology'],
      phone: '+91 98765 00007',
      createdBy: admin1._id,
    });

    // ─── Create Parents ───────────────────────────────────────────────────────
    const parent1 = await User.create({
      name: 'Ravi Verma',
      email: 'parent1@example.com',
      password: 'password123',
      role: 'parent',
      phone: '+91 98765 10001',
      createdBy: admin1._id,
    });

    const parent2 = await User.create({
      name: 'Sunita Patel',
      email: 'parent2@example.com',
      password: 'password123',
      role: 'parent',
      phone: '+91 98765 10002',
      createdBy: admin2._id,
    });

    // ─── Create Patients ──────────────────────────────────────────────────────
    const patient1 = await Patient.create({
      name: 'Aryan Verma',
      dateOfBirth: new Date('2018-03-15'),
      gender: 'male',
      parentDetails: {
        name: 'Ravi Verma',
        phone: '+91 98765 10001',
        email: 'parent1@example.com',
        relationship: 'Father',
        address: '42, MG Road, Indiranagar, Bangalore',
      },
      parent: parent1._id,
      branch: branch1._id,
      enrolledDepartments: ['speech_language', 'pediatric_ot'],
      assignedTherapists: [therapist1._id, therapist2._id],
      diagnosis: 'Autism Spectrum Disorder (ASD)',
      medicalNotes: 'Requires consistent routine. Responds well to visual aids.',
      status: 'active',
      registeredBy: admin1._id,
    });

    const patient2 = await Patient.create({
      name: 'Meera Verma',
      dateOfBirth: new Date('2020-07-22'),
      gender: 'female',
      parentDetails: {
        name: 'Ravi Verma',
        phone: '+91 98765 10001',
        email: 'parent1@example.com',
        relationship: 'Father',
        address: '42, MG Road, Indiranagar, Bangalore',
      },
      parent: parent1._id,
      branch: branch1._id,
      enrolledDepartments: ['behavioral'],
      assignedTherapists: [therapist4._id],
      diagnosis: 'ADHD',
      medicalNotes: 'Hyperactive, difficulty with sustained attention.',
      status: 'active',
      registeredBy: admin1._id,
    });

    const patient3 = await Patient.create({
      name: 'Dev Patel',
      dateOfBirth: new Date('2017-11-05'),
      gender: 'male',
      parentDetails: {
        name: 'Sunita Patel',
        phone: '+91 98765 10002',
        email: 'parent2@example.com',
        relationship: 'Mother',
        address: '18, 100 Feet Road, JP Nagar, Bangalore',
      },
      parent: parent2._id,
      branch: branch2._id,
      enrolledDepartments: ['physiotherapy', 'learning_disabilities'],
      assignedTherapists: [therapist3._id],
      diagnosis: 'Cerebral Palsy (mild)',
      medicalNotes: 'Requires physiotherapy 3x/week. Mild learning delays.',
      status: 'active',
      registeredBy: admin2._id,
    });

    // Update parent children references
    await User.findByIdAndUpdate(parent1._id, { children: [patient1._id, patient2._id] });
    await User.findByIdAndUpdate(parent2._id, { children: [patient3._id] });

    // ─── Create Sample Appointments ───────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Appointment.insertMany([
      {
        patient: patient1._id,
        therapist: therapist1._id,
        branch: branch1._id,
        department: 'speech_language',
        date: today,
        timeSlot: '10:30 - 11:15',
        status: 'scheduled',
        scheduledBy: admin1._id,
      },
      {
        patient: patient1._id,
        therapist: therapist2._id,
        branch: branch1._id,
        department: 'pediatric_ot',
        date: today,
        timeSlot: '11:15 - 12:00',
        status: 'scheduled',
        scheduledBy: admin1._id,
      },
      {
        patient: patient2._id,
        therapist: therapist4._id,
        branch: branch1._id,
        department: 'behavioral',
        date: today,
        timeSlot: '14:15 - 15:00',
        status: 'scheduled',
        scheduledBy: admin1._id,
      },
      {
        patient: patient3._id,
        therapist: therapist3._id,
        branch: branch2._id,
        department: 'physiotherapy',
        date: today,
        timeSlot: '10:30 - 11:15',
        status: 'scheduled',
        scheduledBy: admin2._id,
      },
      {
        patient: patient1._id,
        therapist: therapist1._id,
        branch: branch1._id,
        department: 'speech_language',
        date: tomorrow,
        timeSlot: '10:30 - 11:15',
        status: 'scheduled',
        scheduledBy: admin1._id,
      },
    ]);

    console.log('\n✅ Seed complete! Login credentials:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ROLE        EMAIL                               PASSWORD');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Owner       owner@pediatrictherapy.com          password123`);
    console.log(`Admin-Main  admin.main@pediatrictherapy.com     password123`);
    console.log(`Admin-South admin.south@pediatrictherapy.com    password123`);
    console.log(`Therapist   speech@pediatrictherapy.com         password123`);
    console.log(`Therapist   ot@pediatrictherapy.com             password123`);
    console.log(`Therapist   physio@pediatrictherapy.com         password123`);
    console.log(`Therapist   behavior@pediatrictherapy.com       password123`);
    console.log(`Parent      parent1@example.com                 password123`);
    console.log(`Parent      parent2@example.com                 password123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
