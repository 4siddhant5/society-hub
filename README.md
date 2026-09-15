# 🏢 Society Hub

**Society Hub** is a full-stack residential society management platform designed to simplify communication, issue management, facility bookings, announcements, and emergency coordination between **residents and society administrators**.

The platform provides dedicated dashboards for residents and administrators, with real-time updates powered by Firebase.

🌐 **Live Demo:**
https://societyhubsiddhant.vercel.app

---

## ✨ Features

### 👤 Resident

Residents can use Society Hub to manage their daily society-related activities from one centralized platform.

* 🔐 Registration and login
* ⏳ Resident approval workflow
* 🏠 Personalized resident dashboard
* 📝 Report society issues
* 📋 View and track reported issues
* 📢 View society announcements
* 📊 Participate in polls
* 📅 Book society facilities
* 🗓️ View booking calendar
* 💬 Community chat
* 👥 View society members
* 👤 View and edit profile
* 🔔 Notifications
* 🚨 Emergency SOS alerts
* 📣 Receive society broadcasts
* 📄 Access shared documents/resources

---

### 🛡️ Administrator

Administrators have a dedicated management dashboard for controlling and monitoring society activities.

* 📊 Admin dashboard
* 📈 Society analytics
* 👥 Resident management
* ✅ Approve resident registrations
* 📝 Issue/complaint management
* 🔄 Update issue status
* 📢 Create and manage announcements
* 📊 Create and manage polls
* 📅 Manage facility bookings
* 📣 Send broadcasts
* 📜 View broadcast history
* 🚨 Monitor SOS emergency alerts
* 💬 Community communication
* 👤 Manage profiles
* 🔔 Notification management

---

## 🚨 Emergency SOS System

One of the key features of Society Hub is its emergency alert system.

Residents can trigger an SOS alert during an emergency, allowing the alert to be surfaced to other relevant users and administrators.

The system supports:

* 🚨 Emergency alert creation
* ⚡ Real-time alert detection
* 🔔 Emergency notifications
* 🔊 SOS alert sound
* 📍 Society-specific emergency alerts
* 👀 Admin SOS monitoring
* 📋 Active SOS alert feed

Example workflow:

```text
Resident
   │
   ▼
Trigger SOS
   │
   ▼
Firebase
   │
   ▼
Real-Time Listener
   │
   ├──────────────► Admin
   │
   └──────────────► Residents
                         │
                         ▼
                  Emergency Alert
```

---

## 📝 Issue & Complaint Management

Residents can report problems within their society.

Issues can contain information such as:

* Issue title
* Description
* Category
* Images
* Reporter information
* Society information
* Status

Administrators can review reported issues and update their status.

```text
Reported
   ↓
Under Review
   ↓
In Progress
   ↓
Resolved
```

Residents can then track their submitted issues.

---

## 📢 Announcements

Administrators can publish important society announcements for residents.

The announcement system supports:

* Create announcements
* View announcements
* Update announcements
* Delete announcements
* Society-specific announcements
* Global announcements
* Document/PDF sharing

Residents can access announcements directly from their dashboard.

---

## 📊 Poll Center

Society Hub includes a polling system that allows administrators to create polls and residents to participate in them.

### Admin

* Create polls
* Manage polls
* Close polls
* Monitor participation

### Resident

* View active polls
* Select an option
* Submit vote
* View poll information

This can be useful for society decisions and resident feedback.

---

## 📅 Facility Booking

Residents can book available society facilities through the application.

The booking system provides:

* Facility booking
* Booking management
* My bookings
* Public bookings
* Booking calendar
* Booking status
* Admin booking management

Example:

```text
Select Facility
      ↓
Select Date
      ↓
Select Time
      ↓
Create Booking
      ↓
Booking Management
```

---

## 💬 Community Chat

Society Hub includes a community communication system where residents can interact with other members.

Features include:

* 💬 Community messaging
* 👥 Member list
* 👤 Member profiles
* 🏢 Society group information
* 🟢 Online status
* 🕐 Last-seen information

---

## 📣 Broadcast System

Administrators can send important messages to society residents using the broadcast system.

Admins can:

* Create broadcasts
* Send society-wide messages
* View broadcast history
* Track recent broadcasts

Residents receive recent broadcasts directly within their dashboard.

---

## 🔔 Notifications

Society Hub provides notification functionality for important society activities.

Notifications can be used for:

* Announcements
* Issue updates
* Polls
* Broadcasts
* Emergency alerts
* Other society activities

Firebase-based notification services are integrated into the application.

---

## 📈 Analytics

Administrators have access to an analytics dashboard to monitor society activity.

Analytics can provide information related to:

* 👥 Residents
* 📝 Open issues
* ✅ Resolved issues
* 📊 Active polls
* 📅 Bookings
* 🏢 Society activity

---

## 👥 Resident Approval

New residents can go through an approval workflow before receiving full access to the society.

```text
Registration
     ↓
Pending Approval
     ↓
Admin Review
     ↓
Approved
     ↓
Resident Dashboard
```

This helps administrators maintain control over who can access a society's private information.

---

## 🔐 Authentication & Security

Society Hub uses authentication and role-based access to separate resident and administrator functionality.

The project supports:

* User authentication
* Role-based access
* Resident approval
* Protected application screens
* Society-specific data
* Secure password handling
* Firebase security rules

---

## 🛠️ Tech Stack

| Technology                          | Usage                                |
| ----------------------------------- | ------------------------------------ |
| **React Native**                    | Mobile application development       |
| **Expo**                            | Development and deployment framework |
| **JavaScript**                      | Application logic                    |
| **React**                           | UI architecture                      |
| **Firebase Authentication**         | User authentication                  |
| **Firebase Cloud Firestore**        | Real-time database                   |
| **Firebase Cloud Messaging**        | Notifications                        |
| **Cloudinary**                      | Image/document uploads               |
| **React Native Chart Kit**          | Analytics and charts                 |
| **AsyncStorage**                    | Local persistent storage             |
| **Expo Image Picker**               | Image selection                      |
| **Expo Document Picker**            | Document selection                   |
| **Expo AV**                         | Audio/SOS alert functionality        |
| **WebSocket / Real-time listeners** | Real-time communication              |
| **Vercel**                          | Web deployment                       |

---

## 🏗️ Application Architecture

Society Hub is structured around two primary user roles:

```text
                         ┌──────────────────┐
                         │   Society Hub    │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
              👤 Resident                  🛡️ Admin
                    │                           │
          ┌─────────┼─────────┐       ┌─────────┼─────────┐
          ▼         ▼         ▼       ▼         ▼         ▼
       Issues   Bookings   Chat    Residents  Issues   Analytics
          │         │         │       │         │         │
          ▼         ▼         ▼       ▼         ▼         ▼
    Announcements Polls   SOS     Approvals Announcements
                                      │
                                      ▼
                                  Broadcasts
```

---

## 📱 Main Modules

```text
Society Hub
│
├── Authentication
│   ├── Login
│   ├── Registration
│   └── Resident Approval
│
├── Resident
│   ├── Dashboard
│   ├── My Issues
│   ├── Announcements
│   ├── Polls
│   ├── Bookings
│   ├── Community Chat
│   ├── SOS
│   ├── Notifications
│   └── Profile
│
├── Admin
│   ├── Dashboard
│   ├── Analytics
│   ├── Resident Approval
│   ├── Issue Management
│   ├── Announcements
│   ├── Polls
│   ├── Bookings
│   ├── Broadcasts
│   └── SOS Alerts
│
└── Shared
    ├── Members
    ├── Profiles
    ├── Chat
    ├── Notifications
    └── Society Information
```

---

## 📂 Project Structure

```text
society-hub/
│
├── frontend/
│   │
│   ├── App.js
│   ├── app.json
│   ├── index.js
│   │
│   ├── assets/
│   │   └── sos-alert.wav
│   │
│   └── src/
│       │
│       ├── components/
│       │   ├── config/
│       │   ├── layout/
│       │   └── ui/
│       │
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── ThemeContext.js
│       │
│       ├── hooks/
│       │   └── useAuth.js
│       │
│       ├── layouts/
│       │   ├── AdminLayout.js
│       │   ├── BaseLayout.js
│       │   └── ResidentLayout.js
│       │
│       ├── navigation/
│       │   └── AppNavigator.js
│       │
│       ├── screens/
│       │   ├── AdminDashboard.js
│       │   ├── AnalyticsScreen.js
│       │   ├── BookingScreen.js
│       │   ├── ChatScreen.js
│       │   ├── IssueDetailScreen.js
│       │   ├── LoginScreen.js
│       │   ├── MembersScreen.js
│       │   ├── NotificationScreen.js
│       │   ├── ProfileScreen.js
│       │   ├── RegisterScreen.js
│       │   ├── ResidentDashboard.js
│       │   ├── SOSScreen.js
│       │   └── ...
│       │
│       ├── services/
│       │   ├── announcementService.js
│       │   ├── authService.js
│       │   ├── cloudinaryService.js
│       │   ├── issueService.js
│       │   ├── notificationService.js
│       │   ├── societyService.js
│       │   ├── sosService.js
│       │   └── userService.js
│       │
│       └── utils/
│
├── .env.example
├── firestore.rules
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* Node.js
* npm
* Expo CLI / Expo development environment
* Firebase project
* Cloudinary account if using image/document uploads

### Installation

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/society-hub.git
```

Navigate to the frontend:

```bash
cd society-hub/frontend
```

Install dependencies:

```bash
npm install
```

Configure your environment variables according to `.env.example`.

Then start the Expo development server:

```bash
npm start
```

For web:

```bash
npm run web
```

For Android:

```bash
npm run android
```

For iOS:

```bash
npm run ios
```

---

## 🌐 Live Demo

The deployed web version is available here:

**https://societyhubsiddhant.vercel.app**

---

## 🔑 Demo Login Credentials

The following accounts can be used to explore the deployed application.

### 🛡️ Admin

```text
Email: siddhant45@gmail.com
Password: 12345678
```

### 👤 Resident

```text
Email: yohan@gmail.com
Password: 12345678
```

### 👤 Resident

```text
Email: girish@gmail.com
Password: 12345678
```

> ⚠️ **Important:** These are demo credentials provided for testing the deployed application. If this repository is public, avoid using real or sensitive passwords. Change the demo passwords if necessary before publishing the project.

---

## 🔥 Firebase

The application uses Firebase for real-time application functionality.

Firebase is used for:

* Authentication
* Cloud Firestore
* Real-time data synchronization
* User management
* Society data
* Issues
* Announcements
* Polls
* Bookings
* Notifications
* SOS alerts

---

## ☁️ Cloudinary

Cloudinary is integrated for handling uploaded media and documents.

It can be used for:

* 🖼️ Issue images
* 📄 Documents
* 📎 Shared files

---

## 🔄 Real-Time Functionality

Society Hub uses Firebase real-time listeners to keep important information synchronized.

Real-time updates include:

* New issues
* Issue status changes
* Announcements
* Polls
* Resident registrations
* Broadcasts
* SOS alerts

This allows users to receive updates without manually refreshing the application.

---

## 🎨 UI & UX

The application includes reusable UI components and layouts to maintain consistency across the platform.

The project includes:

* Reusable buttons
* Cards
* Inputs
* Status badges
* Section headers
* Empty states
* Admin layout
* Resident layout
* Bottom navigation
* Sidebar navigation
* Dark/light theme support

---

## 🎯 Project Highlights

* 🏢 Complete society management platform
* 👤 Resident and Admin role separation
* 🔐 Authentication and resident approval
* 📝 Issue and complaint management
* 📢 Society announcements
* 📊 Polling system
* 📅 Facility booking
* 💬 Community chat
* 🚨 Real-time SOS emergency system
* 📣 Society-wide broadcasts
* 🔔 Notification system
* 📈 Admin analytics
* 👥 Resident/member management
* ☁️ Firebase real-time backend
* 🖼️ Cloudinary media uploads
* 📱 React Native + Expo
* 🌐 Deployed web version

---

## 🔮 Future Improvements

Possible future enhancements include:

* 💰 Society maintenance payment management
* 🧾 Digital invoices and receipts
* 📊 Advanced financial analytics
* 🚗 Visitor and vehicle management
* 🅿️ Parking management
* 📦 Delivery management
* 👷 Staff management
* 📍 Enhanced emergency location sharing
* 📱 Native push notification improvements
* 🗺️ Interactive society map
* 🤖 AI-powered complaint categorization
* 📄 Automated society reports

---

## 👨‍💻 Developer

**Siddhant**

Society Hub was developed as a full-stack residential community management platform demonstrating **React Native development, Firebase integration, real-time data synchronization, role-based access, emergency alert systems, communication features, booking workflows, and administrative analytics**.

---

## ⭐ Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.
