# Personal Finance Tracker + AI Insights

This project helps users:
- Track income and expenses
- Review current balance, income, and expense totals
- Store transactions in MongoDB through a Node.js backend

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB, Mongoose

## Run Locally

1. Install backend dependencies:
   `cd backend && npm install`
2. Start MongoDB locally on `mongodb://127.0.0.1:27017`
3. Start the app from the project root:
   `npm start`
4. Open [http://localhost:3001](http://localhost:3001)

## Mobile App

An Expo React Native app now lives in [`/Users/vineetbhatt/Documents/finance-tracker-ai/mobile`](/Users/vineetbhatt/Documents/finance-tracker-ai/mobile) for iOS and Android.

### Mobile Setup

1. Install mobile dependencies:
   `cd mobile && npm install`
2. Update [`/Users/vineetbhatt/Documents/finance-tracker-ai/mobile/src/config.js`](/Users/vineetbhatt/Documents/finance-tracker-ai/mobile/src/config.js) with your computer's local network IP.
3. Start the backend from the project root:
   `npm start`
4. Start Expo:
   `npm run mobile`
5. Open on iOS Simulator, Android Emulator, or Expo Go.

### Mobile Highlights

- Premium card-based finance UI with animated entry transitions
- Native mobile dashboard for overview, transactions, and budgets
- Floating action button and slide-up modal workflows for quick finance operations
- Mobile transaction editing with approval status, review flags, tax metadata, and receipt links
- Shared backend integration so web and mobile use the same finance data

## Current Features

- Create, edit, and delete income or expense transactions
- Store richer transaction details including account, counterparty, payment method, tags, notes, recurring flag, and transaction date
- Search, sort, and filter transactions by type, category, approval status, text query, and date range
- Review monthly analytics for balance, savings rate, average expense, top category, recurring activity, pending approvals, flagged items, and approved spend
- Track category budgets by month and monitor spend against each limit
- Visualize expense breakdowns, monthly trends, and automatically generated insights

## Finance Company Features

- Approval workflow with `pending`, `approved`, and `rejected` transaction states
- Audit-friendly transaction history through stored audit trail entries on create and update
- Counterparty, account, tax category, and source-system metadata for stronger operational reporting
- Review flags for exception handling and finance-ops investigation
- Receipt URL support to connect transactions with supporting documents
- Dashboard metrics that help teams monitor approval queues, flagged activity, and approved expense volume
