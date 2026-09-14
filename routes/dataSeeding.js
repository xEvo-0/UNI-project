const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../model/schema/Registeration');
const departmentModel = require("../model/schema/Department");
const AssignmentModel = require('../model/schema/assignment');
const router = express.Router();

const users = [
  { name: "Rohit Verma", email: "rohit@example.com", password: "pass123", phone: 9000000001, departement: "Computer Science", role: "Student" },
  { name: "Neha Sharma", email: "neha@example.com", password: "pass123", phone: 9000000002, departement: "Electronics and Communication", role: "Professor" },
  { name: "Aman Gupta", email: "aman@example.com", password: "pass123", phone: 9000000003, departement: "Mechanical Engineering", role: "HOD" },
  { name: "Pooja Singh", email: "pooja@example.com", password: "pass123", phone: 9000000004, departement: "Civil Engineering", role: "Student" },
  { name: "Vikas Mehta", email: "vikas@example.com", password: "pass123", phone: 9000000005, departement: "Information Technology", role: "Professor" },
  { name: "Sonal Jain", email: "sonal@example.com", password: "pass123", phone: 9000000006, departement: "Computer Science", role: "Student" },
  { name: "Rajat Khanna", email: "rajat@example.com", password: "pass123", phone: 9000000007, departement: "Electronics and Communication", role: "Professor" },
  { name: "Priya Nair", email: "priya@example.com", password: "pass123", phone: 9000000008, departement: "Mechanical Engineering", role: "Student" },
  { name: "Karan Yadav", email: "karan@example.com", password: "pass123", phone: 9000000009, departement: "Civil Engineering", role: "Professor" },
  { name: "Anjali Thakur", email: "anjali@example.com", password: "pass123", phone: 9000000010, departement: "Information Technology", role: "HOD" },

  { name: "Suresh Iyer", email: "suresh@example.com", password: "pass123", phone: 9000000011, departement: "Computer Science", role: "Professor" },
  { name: "Meena Reddy", email: "meena@example.com", password: "pass123", phone: 9000000012, departement: "Electronics and Communication", role: "Student" },
  { name: "Deepak Chauhan", email: "deepak@example.com", password: "pass123", phone: 9000000013, departement: "Mechanical Engineering", role: "Student" },
  { name: "Komal Joshi", email: "komal@example.com", password: "pass123", phone: 9000000014, departement: "Civil Engineering", role: "Professor" },
  { name: "Arjun Malhotra", email: "arjun@example.com", password: "pass123", phone: 9000000015, departement: "Information Technology", role: "Student" },

  { name: "Sneha Bhat", email: "sneha@example.com", password: "pass123", phone: 9000000016, departement: "Computer Science", role: "Student" },
  { name: "Harshit Pandey", email: "harshit@example.com", password: "pass123", phone: 9000000017, departement: "Electronics and Communication", role: "Professor" },
  // Changed Tanya Kapoor's department to Computer Science to avoid duplicate HOD in Mechanical Engineering
  { name: "Tanya Kapoor", email: "tanya@example.com", password: "pass123", phone: 9000000018, departement: "Computer Science", role: "HOD" },
  { name: "Nikhil Arora", email: "nikhil@example.com", password: "pass123", phone: 9000000019, departement: "Civil Engineering", role: "Professor" },
  { name: "Ritika Chauhan", email: "ritika@example.com", password: "pass123", phone: 9000000020, departement: "Information Technology", role: "Student" },

  { name: "Gaurav Dubey", email: "gaurav@example.com", password: "pass123", phone: 9000000021, departement: "Computer Science", role: "Professor" },
  { name: "Manisha Kaul", email: "manisha@example.com", password: "pass123", phone: 9000000022, departement: "Electronics and Communication", role: "Student" },
  { name: "Aditya Chauhan", email: "aditya@example.com", password: "pass123", phone: 9000000023, departement: "Mechanical Engineering", role: "Professor" },
  { name: "Pallavi Sinha", email: "pallavi@example.com", password: "pass123", phone: 9000000024, departement: "Civil Engineering", role: "Student" },
  { name: "Varun Ahuja", email: "varun@example.com", password: "pass123", phone: 9000000025, departement: "Information Technology", role: "Professor" },

  { name: "Reema Das", email: "reema@example.com", password: "pass123", phone: 9000000026, departement: "Computer Science", role: "Student" },
  { name: "Kunal Bansal", email: "kunal@example.com", password: "pass123", phone: 9000000027, departement: "Electronics and Communication", role: "HOD" },
  { name: "Nisha Tiwari", email: "nisha@example.com", password: "pass123", phone: 9000000028, departement: "Mechanical Engineering", role: "Professor" },
  { name: "Vivek Kumar", email: "vivek@example.com", password: "pass123", phone: 9000000029, departement: "Civil Engineering", role: "Student" },
  { name: "Divya Yadav", email: "divya@example.com", password: "pass123", phone: 9000000030, departement: "Information Technology", role: "Professor" },

  { name: "Rahul Sen", email: "rahul@example.com", password: "pass123", phone: 9000000031, departement: "Computer Science", role: "Student" },
  { name: "Mitali Ghosh", email: "mitali@example.com", password: "pass123", phone: 9000000032, departement: "Electronics and Communication", role: "Professor" },
  { name: "Ishaan Dey", email: "ishaan@example.com", password: "pass123", phone: 9000000033, departement: "Mechanical Engineering", role: "Student" },
  { name: "Preeti Nanda", email: "preeti@example.com", password: "pass123", phone: 9000000034, departement: "Civil Engineering", role: "Professor" },
  // Changed Alok Mishra's role to Professor in Mechanical Engineering to avoid duplicate HOD in Information Technology
  { name: "Alok Mishra", email: "alok@example.com", password: "pass123", phone: 9000000035, departement: "Mechanical Engineering", role: "Professor" },

  { name: "Simran Gill", email: "simran@example.com", password: "pass123", phone: 9000000036, departement: "Computer Science", role: "Student" },
  { name: "Devendra Patil", email: "devendra@example.com", password: "pass123", phone: 9000000037, departement: "Electronics and Communication", role: "Professor" },
  { name: "Kavita Menon", email: "kavita@example.com", password: "pass123", phone: 9000000038, departement: "Mechanical Engineering", role: "Student" },
  { name: "Rohini Joshi", email: "rohini@example.com", password: "pass123", phone: 9000000039, departement: "Civil Engineering", role: "Professor" },
  { name: "Sameer Puri", email: "sameer@example.com", password: "pass123", phone: 9000000040, departement: "Information Technology", role: "Student" },

  { name: "Swati Aggarwal", email: "swati@example.com", password: "pass123", phone: 9000000041, departement: "Computer Science", role: "Professor" },
  { name: "Aarti Bansal", email: "aarti@example.com", password: "pass123", phone: 9000000042, departement: "Electronics and Communication", role: "Student" },
  { name: "Puneet Bhalla", email: "puneet@example.com", password: "pass123", phone: 9000000043, departement: "Mechanical Engineering", role: "Professor" },
  { name: "Monika Jain", email: "monika@example.com", password: "pass123", phone: 9000000044, departement: "Civil Engineering", role: "HOD" },
  { name: "Ravi Kapoor", email: "ravi@example.com", password: "pass123", phone: 9000000045, departement: "Information Technology", role: "Student" },

  { name: "Dhruv Batra", email: "dhruv@example.com", password: "pass123", phone: 9000000046, departement: "Computer Science", role: "Professor" },
  { name: "Payal Raina", email: "payal@example.com", password: "pass123", phone: 9000000047, departement: "Electronics and Communication", role: "Student" },
  { name: "Rajeev Sood", email: "rajeev@example.com", password: "pass123", phone: 9000000048, departement: "Mechanical Engineering", role: "Professor" },
  { name: "Lavanya Pillai", email: "lavanya@example.com", password: "pass123", phone: 9000000049, departement: "Civil Engineering", role: "Student" },
  // Changed Tarun Joshi's role to Professor in Information Technology to avoid duplicate HOD in Information Technology
  { name: "Tarun Joshi", email: "tarun@example.com", password: "pass123", phone: 9000000050, departement: "Information Technology", role: "Professor" }
];

const Userseeding = async () => {
  await userModel.deleteMany({});
  
  // Hash user passwords using bcrypt
  const hashedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 10)
  }));
  
  await userModel.insertMany(hashedUsers);
  console.log("User data seeding ..... ");
};

const department = [
  { departmentName: "Computer Science", programmeType: "Undergraduate", address: "Building A, Floor 2" },
  { departmentName: "Information Technology", programmeType: "Postgraduate", address: "Building A, Floor 3" },
  { departmentName: "Electronics and Communication", programmeType: "Undergraduate", address: "Building B, Floor 1" },
  { departmentName: "Mechanical Engineering", programmeType: "Undergraduate", address: "Building C, Floor 2" },
  { departmentName: "Civil Engineering", programmeType: "Undergraduate", address: "Building D, Floor 1" },
  { departmentName: "Electrical Engineering", programmeType: "Postgraduate", address: "Building E, Floor 3" },
  { departmentName: "Automobile Engineering", programmeType: "Undergraduate", address: "Building F, Floor 1" },
  { departmentName: "Biotechnology", programmeType: "Undergraduate", address: "Building G, Floor 2" },
  { departmentName: "Chemical Engineering", programmeType: "Undergraduate", address: "Building H, Floor 2" },
  { departmentName: "Physics", programmeType: "Postgraduate", address: "Building I, Floor 3" },
  { departmentName: "Mathematics", programmeType: "Undergraduate", address: "Building I, Floor 1" },
  { departmentName: "English Literature", programmeType: "Undergraduate", address: "Building J, Floor 2" },
  { departmentName: "History", programmeType: "Postgraduate", address: "Building J, Floor 3" },
  { departmentName: "Political Science", programmeType: "Undergraduate", address: "Building K, Floor 1" },
  { departmentName: "Psychology", programmeType: "Undergraduate", address: "Building K, Floor 2" },
  { departmentName: "Sociology", programmeType: "Postgraduate", address: "Building L, Floor 1" },
  { departmentName: "Economics", programmeType: "Undergraduate", address: "Building L, Floor 3" },
  { departmentName: "Commerce", programmeType: "Undergraduate", address: "Building M, Floor 1" },
  { departmentName: "Management Studies", programmeType: "Postgraduate", address: "Building M, Floor 2" },
  { departmentName: "Accounting and Finance", programmeType: "Postgraduate", address: "Building N, Floor 3" },
  { departmentName: "Law", programmeType: "Undergraduate", address: "Building O, Floor 1" },
  { departmentName: "Fine Arts", programmeType: "Undergraduate", address: "Building P, Floor 2" },
  { departmentName: "Performing Arts", programmeType: "Postgraduate", address: "Building P, Floor 3" },
  { departmentName: "Architecture", programmeType: "Undergraduate", address: "Building Q, Floor 1" },
  { departmentName: "Interior Design", programmeType: "Postgraduate", address: "Building Q, Floor 2" },
  { departmentName: "Fashion Design", programmeType: "Undergraduate", address: "Building R, Floor 3" },
  { departmentName: "Media Studies", programmeType: "Undergraduate", address: "Building S, Floor 1" },
  { departmentName: "Mass Communication", programmeType: "Postgraduate", address: "Building S, Floor 2" },
  { departmentName: "Hotel Management", programmeType: "Undergraduate", address: "Building T, Floor 1" },
  { departmentName: "Tourism Management", programmeType: "Postgraduate", address: "Building T, Floor 3" },
  { departmentName: "Pharmacy", programmeType: "Undergraduate", address: "Building U, Floor 1" },
  { departmentName: "Pharmacology", programmeType: "Postgraduate", address: "Building U, Floor 2" },
  { departmentName: "Nursing", programmeType: "Undergraduate", address: "Building V, Floor 1" },
  { departmentName: "Medical Laboratory Technology", programmeType: "Undergraduate", address: "Building V, Floor 2" },
  { departmentName: "Radiology", programmeType: "Undergraduate", address: "Building W, Floor 1" },
  { departmentName: "Public Health", programmeType: "Postgraduate", address: "Building W, Floor 2" },
  { departmentName: "Data Science", programmeType: "Undergraduate", address: "Building X, Floor 3" },
  { departmentName: "Artificial Intelligence", programmeType: "Postgraduate", address: "Building X, Floor 2" },
  { departmentName: "Cyber Security", programmeType: "Undergraduate", address: "Building Y, Floor 1" },
  { departmentName: "Machine Learning", programmeType: "Postgraduate", address: "Building Y, Floor 2" },
  { departmentName: "Robotics", programmeType: "Undergraduate", address: "Building Z, Floor 1" },
  { departmentName: "Astronomy", programmeType: "Postgraduate", address: "Building Z, Floor 3" },
  { departmentName: "Geology", programmeType: "Undergraduate", address: "Building AA, Floor 1" },
  { departmentName: "Environmental Science", programmeType: "Postgraduate", address: "Building AB, Floor 2" },
  { departmentName: "Food Technology", programmeType: "Undergraduate", address: "Building AC, Floor 3" },
  { departmentName: "Agriculture", programmeType: "Undergraduate", address: "Building AD, Floor 1" },
  { departmentName: "Rural Development", programmeType: "Postgraduate", address: "Building AE, Floor 2" },
  { departmentName: "Sports Science", programmeType: "Undergraduate", address: "Building AF, Floor 1" },
  { departmentName: "Library Science", programmeType: "Undergraduate", address: "Building AG, Floor 3" },
  { departmentName: "Education", programmeType: "Postgraduate", address: "Building AH, Floor 2" }
];

const departmentSeeding = async () => {
  await departmentModel.deleteMany({});
  await departmentModel.insertMany(department);
  console.log("Department data seeding ..... ");
};

const assignmentsSeedData = [
  {
    title: "Data Structures Assignment",
    description: "Implement stack and queue using arrays",
    category: "assignment",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-04")
  },
  {
    title: "Computer Networks Assignment",
    description: "Explain OSI and TCP/IP models",
    category: "assignment",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-11")
  },
  {
    title: "Cybersecurity Thesis",
    description: "Thesis on penetration testing & vulnerabilities",
    category: "thesis",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-12")
  },
  {
    title: "DBMS SQL Project",
    description: "Write queries for banking schema",
    category: "assignment",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-13")
  },
  {
    title: "Blockchain Thesis",
    description: "Thesis on decentralized identity",
    category: "thesis",
    status: "Rejected",
    remark: "Incomplete literature review",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-15")
  },
  {
    title: "Networking Report",
    description: "LAN vs WAN analysis with case study",
    category: "report",
    status: "Rejected",
    remark: "Plagiarism detected",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-10")
  },
  {
    title: "Quantum Computing Thesis",
    description: "Algorithms for QKD and Grover’s search",
    category: "thesis",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-14")
  },
  {
    title: "Python Automation Assignment",
    description: "Develop automation scripts using Selenium",
    category: "assignment",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-14")
  },
  {
    title: "Cloud DevOps Report",
    description: "AWS CI/CD pipeline deployment study",
    category: "report",
    status: "Forwarded",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-16")
  },
  {
    title: "AI Ethical Risk Report",
    description: "Bias detection in large models",
    category: "report",
    status: "Approved",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-17")
  },
  {
    title: "Operating Systems Assignment",
    description: "Deadlock, mutex & scheduling algorithms",
    category: "assignment",
    status: "Submitted",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-18")
  },
  {
    title: "Android Development Mini Project",
    description: "Build notes app using Room DB",
    category: "assignment",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-19")
  },
  {
    title: "IoT Systems Thesis",
    description: "Smart home automation using MQTT",
    category: "thesis",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-20")
  },
  {
    title: "Microservices Report",
    description: "Scalable APIs using Docker Swarm",
    category: "report",
    status: "Submitted",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-18")
  },
  {
    title: "ML Regression Research",
    description: "Compare polynomial & ridge regression",
    category: "thesis",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-22")
  },
  {
    title: "Software Engineering Report",
    description: "Agile vs Waterfall comparative study",
    category: "report",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-21")
  },
  {
    title: "Full Stack Project",
    description: "Blog platform using MERN with JWT auth",
    category: "assignment",
    status: "Submitted",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-23")
  },
  {
    title: "Big Data Report",
    description: "Hadoop & Spark stream processing",
    category: "report",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-24")
  },
  {
    title: "Compiler Design Assignment",
    description: "Lexical analyzer using Flex",
    category: "assignment",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-25")
  },
  {
    title: "Deep Learning Thesis",
    description: "CNN architecture for image classification",
    category: "thesis",
    status: "Draft",
    filename: [], download_url: [], preview_url: [],
    submittedAt: new Date("2025-01-26")
  }
];

const assignmentSeeding = async () => {
  await AssignmentModel.deleteMany({});

  const dbUsers = await userModel.find({});
  if (!dbUsers || dbUsers.length === 0) {
    console.error("No users found in database! Please seed users first.");
    return;
  }

  const students = dbUsers.filter(u => u.role === 'Student');
  const professors = dbUsers.filter(u => u.role === 'Professor');
  const hods = dbUsers.filter(u => u.role === 'HOD');

  const findUserByName = (name) => dbUsers.find(u => u.name === name);

  const processedAssignments = assignmentsSeedData.map(assign => {
    let studentName = "";
    
    // Map assignments to specific students matching departments
    if (assign.title === "Data Structures Assignment" ||
        assign.title === "Computer Networks Assignment" ||
        assign.title === "Quantum Computing Thesis" ||
        assign.title === "Compiler Design Assignment" ||
        assign.title === "Full Stack Project") {
      studentName = "Rohit Verma"; // CS student
    } else if (assign.title === "Cybersecurity Thesis" ||
               assign.title === "DBMS SQL Project") {
      studentName = "Sonal Jain"; // CS student
    } else if (assign.title === "Python Automation Assignment" ||
               assign.title === "ML Regression Research" ||
               assign.title === "Big Data Report" ||
               assign.title === "Deep Learning Thesis") {
      studentName = "Sneha Bhat"; // CS student
    } else if (assign.title === "Blockchain Thesis" ||
               assign.title === "Networking Report" ||
               assign.title === "Cloud DevOps Report" ||
               assign.title === "Android Development Mini Project" ||
               assign.title === "Microservices Report") {
      studentName = "Arjun Malhotra"; // IT student
    } else if (assign.title === "AI Ethical Risk Report" ||
               assign.title === "Software Engineering Report") {
      studentName = "Ritika Chauhan"; // IT student
    } else if (assign.title === "Operating Systems Assignment") {
      studentName = "Deepak Chauhan"; // Mechanical student
    } else if (assign.title === "IoT Systems Thesis") {
      studentName = "Meena Reddy"; // EC student
    } else {
      studentName = students[0] ? students[0].name : "Rohit Verma";
    }

    const studentObj = findUserByName(studentName);
    if (!studentObj) {
      console.warn(`Seed student ${studentName} not found! Defaulting to first student.`);
      return null;
    }

    let reviewerName = null;
    let professorName = null;
    let approvedBy = null;
    let rejectedBy = null;

    if (assign.status === "Submitted") {
      // Reviewer is a professor in the same department
      const deptProfs = professors.filter(p => p.departement === studentObj.departement);
      const prof = deptProfs[0] || professors[0];
      reviewerName = prof ? prof.name : null;
      professorName = prof ? prof.name : null;
    } else if (assign.status === "Forwarded") {
      // Forwarded to HOD, reviewed/approved by Professor
      const deptProfs = professors.filter(p => p.departement === studentObj.departement);
      const prof = deptProfs[0] || professors[0];
      const deptHods = hods.filter(h => h.departement === studentObj.departement);
      const hod = deptHods[0] || hods[0];
      reviewerName = hod ? hod.name : null;
      professorName = prof ? prof.name : null;
      approvedBy = "Professor";
    } else if (assign.status === "Approved") {
      // Approved by HOD
      const deptProfs = professors.filter(p => p.departement === studentObj.departement);
      const prof = deptProfs[0] || professors[0];
      reviewerName = null;
      professorName = prof ? prof.name : null;
      approvedBy = "HOD";
    } else if (assign.status === "Rejected") {
      const deptProfs = professors.filter(p => p.departement === studentObj.departement);
      const prof = deptProfs[0] || professors[0];
      reviewerName = null;
      professorName = prof ? prof.name : null;
      if (assign.title === "Networking Report") {
        rejectedBy = "HOD";
      } else {
        rejectedBy = "Professor";
      }
    }

    return {
      studentId: studentObj._id,
      submittedBy: studentObj.name,
      title: assign.title,
      description: assign.description,
      category: assign.category,
      status: assign.status,
      filename: assign.filename,
      download_url: assign.download_url,
      preview_url: assign.preview_url,
      approvedBy,
      rejectedBy,
      remark: assign.remark || null,
      currentReviewer: reviewerName,
      professorName,
      submittedAt: assign.submittedAt
    };
  }).filter(Boolean);

  await AssignmentModel.insertMany(processedAssignments);
  console.log("Assignment data seeding ..... ");
};

module.exports = { router, departmentSeeding, Userseeding, assignmentSeeding };