const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');

// Raw 2022 data parsed directly from provided dataset
// NOTE: Phone and secondary_phone are strictly EXCLUDED in adherence to privacy requirements.
const RAW_2022_RECORDS = [
  { name: 'Abhishek Badgujar', email: 'badgujarabhishek@gmail.com', secondary_email: '', company: 'Aziro Software Pvt Ltd', role: '', linkedin: 'https://www.linkedin.com/in/abhishek-badgujar/' },
  { name: 'Gade Aditya Balasaheb', email: 'gadeaditya02@gmail.com', secondary_email: '', company: '', role: 'Salesforce Developer', linkedin: 'https://www.linkedin.com/in/adityagade' },
  { name: 'Mundhe Aditya Madhav', email: 'cooladityamundhe@gmail.com', secondary_email: 'mmundhe9@gmail.com', company: 'Securly', role: '', linkedin: 'https://www.linkedin.com/in/aditya-mundhe-b77997224' },
  { name: 'Hinge Akash Narhar', email: 'akashhinge2000@gmail.com', secondary_email: 'advhinge7@gmail.com', company: 'Infosys', role: '', linkedin: 'https://www.linkedin.com/in/akash-hinge-001845190' },
  { name: 'Kadlag Akash Ramdas', email: 'akashkadlag8@gmail.com', secondary_email: 'ramdaskadlag002@gmail.com', company: 'FiniQ Consulting', role: '', linkedin: 'https://www.linkedin.com/in/akash-kadlag-2292aa200' },
  { name: 'Bhadke Amit Arjun', email: 'amitbhadke786@gmail.com', secondary_email: '', company: 'Seagate', role: 'Data Analyst', linkedin: 'https://www.linkedin.com/in/amit-bhadke-7b800b202' },
  { name: 'Deshmukh Amod Pravin', email: 'amoddeshmukh01234@gmail.com', secondary_email: 'pravinghorpade24@gmail.com', company: 'Sidhman', role: 'Flutter Developer (Mobile App Dev)', linkedin: 'https://www.linkedin.com/in/amod-deshmukh-a11b82287' },
  { name: 'Deochake Anisha Swapnil', email: 'anishadeochake14@gmail.com', secondary_email: 'swapnildeochake21078@gmail.com', company: 'TCS', role: 'AI Engineer', linkedin: 'https://www.linkedin.com/in/anisha-deochake' },
  { name: 'Patil Ankit Yashwant', email: 'ankitpatil3003@gmail.com', secondary_email: 'yashg.patil@gmail.com', company: 'BNY', role: 'AI/ML Engineer (NYC)', linkedin: 'https://www.linkedin.com/in/ankit-patil-aiml' },
  { name: 'Thosar Atharva Sunil', email: 'atharvathosar3@gmail.com', secondary_email: 'sunilthosar67@gmail.com', company: 'Zepto', role: 'Inventory Manager, DH Operations', linkedin: 'https://www.linkedin.com/in/atharva-thosar-bb46951b4' },
  { name: 'Patil Bhagyoday Maruti', email: 'bhagyoday.riverdale@gmail.com', secondary_email: '', company: 'Montran India', role: 'Assistant Software Engineer', linkedin: 'https://www.linkedin.com/in/atharva-thosar-bb46951b4' },
  { name: 'Shingate Dheeraj Vilas', email: 'dheerajshingate0816@gmail.com', secondary_email: '', company: 'Persistent Systems', role: 'Lead Software Engineer', linkedin: 'https://www.linkedin.com/in/dheeraj-shingate-4a994516b' },
  { name: 'Gourangni Bhola', email: 'gourangnibhola10288@gmail.com', secondary_email: 'bholarajeshwar@gmail.com', company: 'General Aeronautics Pvt Ltd', role: 'Marketing Manager', linkedin: 'https://www.linkedin.com/in/gourangni-bhola-24ba43214' },
  { name: 'Bhattacharjee Irene Joydeep', email: '', secondary_email: 'joy_sumana@hotmail.com', company: 'VYUHAA Med', role: 'Product Management Intern', linkedin: 'https://www.linkedin.com/in/irene-bhattacharjee' },
  { name: 'Rajole Jayesh Vishnu', email: 'jayeshrajole1456@gmail.com', secondary_email: 'vishnurajole98@gmail.com', company: 'Jio Platforms Limited (JPL)', role: 'iOS Developer', linkedin: 'https://www.linkedin.com/in/jayeshrajole' },
  { name: 'Saudagar Karishma Amol', email: '', secondary_email: '', company: 'Wipro', role: 'Project Engineer', linkedin: 'https://www.linkedin.com/in/karishma-saudagar-836529213' },
  { name: 'Patekar Komal Sanjay', email: 'komalpatekar09@gmail.com', secondary_email: 'sumanartvcard@gmail.com', company: 'Vegyan Systems', role: 'Senior Software Engineer', linkedin: 'https://www.linkedin.com/in/komal-patekar-a2b764187' },
  { name: 'Kapse Latesh Devidas', email: 'lateshkapse131@gmail.com', secondary_email: '', company: 'NVIDIA', role: 'SWQA Test Developer', linkedin: 'https://www.linkedin.com/in/latesh-kapse-b80591328' },
  { name: 'Jadhav Malhar Deelip', email: 'malharjadhav8999@gmail.com', secondary_email: 'jdjmalhar99@gmail.com', company: 'ConnectWise', role: 'Senior Software Engineer', linkedin: 'https://www.linkedin.com/in/malhar-jadhav-137b2a215' },
  { name: 'Mali Nachiket Mohan', email: 'nachiketm1a2l3i4@gmail.com', secondary_email: '', company: 'Altimetrik', role: 'Associate Engineer, Product and Platform Engineering', linkedin: 'https://www.linkedin.com/in/nachiketmali36' },
  { name: 'Badgujar Pranali Pravin', email: 'badgujar.pranali@gmail.com', secondary_email: '', company: 'Infosys', role: 'Associate Consultant', linkedin: 'https://www.linkedin.com/in/pranalibadgujar' },
  { name: 'Baviskar Pranjali Arun', email: 'pranjalibaviskar12@gmail.com', secondary_email: '', company: 'Persistent Systems', role: 'Lead Software Engineer', linkedin: 'https://www.linkedin.com/in/pranjali-baviskar-192299251' },
  { name: 'Sawant Prasad Satish', email: 'sawantprasad518@gmail.com', secondary_email: '', company: 'PayPal', role: 'Software Engineer', linkedin: 'https://www.linkedin.com/in/prasadsawant518' },
  { name: 'Godse Rajshree Ashok', email: 'godserajshree786@gmail.com', secondary_email: '', company: 'Bosch Global Software Technologies', role: 'Software Engineer', linkedin: 'https://www.linkedin.com/in/rajshreegodse18' },
  { name: 'Khamkar Rohit Shivaji', email: 'rohitkhamkar12042000@gmail.com', secondary_email: '', company: 'Persistent Systems', role: 'Lead Software Developer', linkedin: 'https://www.linkedin.com/in/rohit-khamkar23' },
  { name: 'Desale Roshan Vilas', email: 'roshandesale217@gmail.com', secondary_email: '', company: 'Infosys', role: 'Digital Specialist Engineer', linkedin: 'https://www.linkedin.com/in/roshan-desale' },
  { name: 'Rojekar Rutik Pramod', email: 'rutik2912@gmail.com', secondary_email: '', company: 'eGain Corporation', role: 'Software Engineer 1', linkedin: 'https://www.linkedin.com/in/rutik-rojekar' },
  { name: 'Deshmukh Rutuja Prashant', email: 'pashdesh98@gmail.com', secondary_email: '', company: 'SGX FX', role: 'Product Management Intern', linkedin: 'https://www.linkedin.com/in/rutuja-deshmukh-rd' },
  { name: 'Ugale Rutuja Vinayak', email: 'rutujaugale48@gmail.com', secondary_email: '', company: 'Vegayan Systems', role: 'Senior Software Engineer', linkedin: 'https://www.linkedin.com/in/rutuja-ugale' },
  { name: 'Pande Shreyas Prashantkumar', email: 's.pande16122000@gmail.com', secondary_email: '', company: 'Siemens', role: 'Generative AI Solutions Engineer', linkedin: 'https://www.linkedin.com/in/shreyas-pande' },
  { name: 'Tadas Shubham Ravindra', email: 'shubhamtadas828@gmail.com', secondary_email: '', company: 'Dassault Systemes', role: 'Software Engineering Specialist', linkedin: 'https://www.linkedin.com/in/srtadas' },
  { name: 'Jagdale Shweta Ankush', email: 'jagdaleshweta8610@gmail.com', secondary_email: '', company: 'Persistent Systems', role: 'Lead Software Engineer (Data Engineer)', linkedin: 'https://www.linkedin.com/in/shweta-jagdale-dataengineer' },
  { name: 'Sahare Siddhant Amol', email: 'siddhants8019@gmail.com', secondary_email: '', company: 'BrowserStack', role: 'Software Engineer', linkedin: 'https://www.linkedin.com/in/siddhantsahare' },
  { name: 'Sarode Sohil Kiran', email: 'sohilsarode5@gmail.com', secondary_email: '', company: "Lowe's India", role: 'Software Engineer', linkedin: 'https://www.linkedin.com/in/sohil-sarode' },
  { name: 'Srivastava Sumira Mukul', email: 'sumirasrivastava13@gmail.com', secondary_email: '', company: 'ICICI Lombard', role: 'Marketing Management Trainee', linkedin: 'https://www.linkedin.com/in/sumira-srivastava' },
  { name: 'Bapat Vidit Vivek', email: 'viditbapat@gmail.com', secondary_email: '', company: 'FinIQ', role: 'Full-time', linkedin: 'https://www.linkedin.com/in/vidit-bapat' },
  { name: 'Gade Yash Pandit', email: 'yashgade487@gmail.com', secondary_email: '', company: 'NVIDIA', role: 'Tool Developer Engineer', linkedin: 'https://www.linkedin.com/in/yash-gade-18724b1b3' },
  { name: 'Tak Aarti Kailas', email: 'takaarti10@gmail.com', secondary_email: '', company: 'IBM', role: 'Software Engineer', linkedin: 'https://www.linkedin.com/in/aarti-tak-a92b35165' },
  { name: 'Sutaria Aayushi', email: 'aayushisutaria017@gmail.com', secondary_email: '', company: 'Netcracker Technology', role: 'Software Engineer', linkedin: 'https://www.linkedin.com/in/aayushi-as' },
  { name: 'Patil Abhishek Jayawantrao', email: 'abhishekpatil20082000@gmail.com', secondary_email: '', company: 'NVIDIA', role: 'Tools Development Engineer', linkedin: 'https://www.linkedin.com/in/abhishek-patil-429769191' },
  { name: 'Shukla Adarsh Ashwini', email: 'adarshashwinshukla@gmail.com', secondary_email: '', company: 'Remiges Technologies Pvt Ltd', role: 'Application Engineer', linkedin: 'https://www.linkedin.com/in/adarsh-shukla-6537a31b4' },
  { name: 'Gondhalekar Adwait Atul', email: 'adwaitgondhalekar@gmail.com', secondary_email: '', company: '', role: '', linkedin: '' },
  { name: 'Giri Akash Jeevan', email: 'akashjgiri2001@gmail.com', secondary_email: '', company: 'Qualcomm', role: 'Engineer', linkedin: 'https://www.linkedin.com/in/akash-giri' },
  { name: 'Chavan Anjali Tarachand', email: 'anjalichavan265@gmail.com', secondary_email: '', company: 'MSS International', role: 'Senior Sales Officer', linkedin: 'https://www.linkedin.com/in/anjali-chavan-15b8a11b0' },
  { name: 'Karke Ashwini Lalit', email: 'ashwinik6112000@gmail.com', secondary_email: '', company: 'Perennial Systems', role: 'Senior Associate', linkedin: 'https://www.linkedin.com/in/ashwini-karke-157801174' },
  { name: 'Shirsath Dhanashri Gorak', email: 'dhanashrishirsath2000@gmail.com', secondary_email: '', company: 'Rockwell Automation', role: 'Associate Software Engineer', linkedin: 'https://www.linkedin.com/in/dhanashri-shirsath-2985b51b2' },
  { name: 'Mujumdar Radha Nitin', email: 'radhamujumdar@gmail.com', secondary_email: '', company: 'FiniQ', role: 'Angular Developer', linkedin: 'https://www.linkedin.com/in/radhamujumdar' },
  { name: 'Dhage Rambhau Santosh', email: 'rambhaudhage1234@gmail.com', secondary_email: '', company: 'Mphasis', role: 'Senior Software Engineer', linkedin: 'https://www.linkedin.com/in/rambhau-dhage-671790197' }
];

/**
 * Normalizes company name for grouping and detection of variants.
 * e.g. "FiniQ Consulting" -> "finiq"
 */
function normalizeCompanyName(name) {
  if (!name || !name.trim()) return 'Company Not Specified';
  const clean = name.trim().toLowerCase();
  if (clean.includes('finiq')) return 'FinIQ';
  if (clean.includes('vegyan') || clean.includes('vegayan')) return 'Vegayan Systems';
  if (clean.includes('jio')) return 'Jio Platforms Limited';
  if (clean.includes('aziro')) return 'Aziro Software';
  if (clean.includes('persistent')) return 'Persistent Systems';
  return name.trim();
}

/**
 * Derives common skills/technologies from role & company if empty
 */
function inferSkills(role, company) {
  const text = `${role} ${company}`.toLowerCase();
  const list = [];
  if (text.includes('salesforce')) list.push('Salesforce', 'Apex', 'Cloud');
  if (text.includes('data analyst') || text.includes('data engineer')) list.push('Data Analysis', 'SQL', 'Python');
  if (text.includes('ai') || text.includes('ml')) list.push('Machine Learning', 'Python', 'AI');
  if (text.includes('flutter') || text.includes('mobile')) list.push('Flutter', 'Dart', 'Mobile Dev');
  if (text.includes('ios')) list.push('iOS', 'Swift', 'Xcode');
  if (text.includes('angular')) list.push('Angular', 'TypeScript', 'JavaScript');
  if (text.includes('lead') || text.includes('software')) list.push('Software Engineering', 'Java', 'Web');
  if (text.includes('qa') || text.includes('test')) list.push('QA Automation', 'Testing');
  if (text.includes('marketing')) list.push('Product Marketing', 'Growth');
  if (text.includes('nvidia') || text.includes('tools')) list.push('Python', 'C++', 'Systems');
  if (list.length === 0) list.push('Software Development', 'Problem Solving');
  return [...new Set(list)];
}

/**
 * Idempotently imports all valid records from the 2022 Alumni dataset.
 * Strictly ignores phone numbers.
 */
async function import2022Alumni() {
  const summary = {
    total: RAW_2022_RECORDS.length,
    inserted: 0,
    updated: 0,
    duplicates: 0,
    invalid: 0,
    missingCompany: 0,
    missingRole: 0,
    missingEmail: 0,
    missingLinkedIn: 0,
    companyVariants: [
      { canonical: 'FinIQ', variants: ['FinIQ', 'FiniQ', 'FiniQ Consulting'], count: 3 },
      { canonical: 'Vegayan Systems', variants: ['Vegyan Systems', 'Vegayan Systems'], count: 2 }
    ],
    companyCounts: {},
    timestamp: new Date(),
  };

  const processedNames = new Set();

  for (const raw of RAW_2022_RECORDS) {
    if (!raw.name || !raw.name.trim()) {
      summary.invalid += 1;
      continue;
    }

    const trimmedName = raw.name.trim();

    // Deduplicate in-memory if repeated in source
    if (processedNames.has(trimmedName.toLowerCase())) {
      summary.duplicates += 1;
      continue;
    }
    processedNames.add(trimmedName.toLowerCase());

    // Resolve primary email or safe placeholder
    let email = (raw.email || '').trim().toLowerCase();
    if (!email && raw.secondary_email) {
      email = raw.secondary_email.trim().toLowerCase();
    }
    if (!email) {
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      email = `${slug}.2022@alumni.kkwagh.edu.in`;
      summary.missingEmail += 1;
    }

    const secondaryEmail = (raw.secondary_email || '').trim().toLowerCase();
    const company = (raw.company || '').trim() || 'Company Not Specified';
    const role = (raw.role || '').trim() || 'Role Not Specified';
    const linkedin = (raw.linkedin || '').trim();

    if (company === 'Company Not Specified') summary.missingCompany += 1;
    if (role === 'Role Not Specified') summary.missingRole += 1;
    if (!linkedin) summary.missingLinkedIn += 1;

    const normComp = normalizeCompanyName(company);
    summary.companyCounts[company] = (summary.companyCounts[company] || 0) + 1;

    try {
      // 1. Ensure User account exists
      let user = await User.findOne({ email });
      let wasUserCreated = false;

      if (!user) {
        user = await User.create({
          name: trimmedName,
          email,
          password: 'Alumni@2022',
          role: 'alumni',
          status: 'active',
          isVerified: true,
          institution: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
        });
        wasUserCreated = true;
      }

      // 2. Ensure AlumniProfile exists and is mapped
      let profile = await AlumniProfile.findOne({ user: user._id });
      const skills = inferSkills(role, company);

      if (!profile) {
        profile = await AlumniProfile.create({
          user: user._id,
          fullName: trimmedName,
          email,
          secondaryEmail: secondaryEmail !== email ? secondaryEmail : undefined,
          college: 'K.K. Wagh Institute of Engineering Education & Research (KKWAGH)',
          department: 'Computer Engineering',
          degree: 'B.E.',
          graduationYear: 2022,
          batch: '2022',
          currentCompany: company,
          companyNormalized: normComp,
          currentJobTitle: role,
          professionalDomain: 'Technology',
          industry: 'Information Technology',
          skills,
          technologies: skills.slice(0, 3),
          experienceYears: 2,
          linkedinUrl: linkedin || undefined,
          linkedinVisibility: 'private', // Default to private per Requirement 4
          linkedinConfirmed: false,
          importSource: 'alumni_database_2022',
          importBatch: '2022',
          verificationStatus: 'verified',
          verifiedAt: new Date(),
        });
        summary.inserted += 1;
      } else {
        // Safe update: update company/role if previously unspecified, ensure 2022 metadata
        let changed = false;
        if (profile.currentCompany === 'Company Not Specified' && company !== 'Company Not Specified') {
          profile.currentCompany = company;
          profile.companyNormalized = normComp;
          changed = true;
        }
        if (profile.currentJobTitle === 'Role Not Specified' && role !== 'Role Not Specified') {
          profile.currentJobTitle = role;
          changed = true;
        }
        if (!profile.linkedinUrl && linkedin) {
          profile.linkedinUrl = linkedin;
          changed = true;
        }
        if (!profile.importBatch) {
          profile.importBatch = '2022';
          profile.importSource = 'alumni_database_2022';
          changed = true;
        }
        if (changed) {
          await profile.save();
          summary.updated += 1;
        } else {
          summary.duplicates += 1;
        }
      }
    } catch (err) {
      console.error(`[import2022] Error processing ${trimmedName}:`, err.message);
      summary.invalid += 1;
    }
  }

  return summary;
}

module.exports = {
  RAW_2022_RECORDS,
  import2022Alumni,
  normalizeCompanyName,
};
