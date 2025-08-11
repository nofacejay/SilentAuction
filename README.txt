SILENT AUCTION - Jayden Prasad 300367841

Live Demo: 
[https://silentauction-nofacejay.vercel.app](https://silentauction-nofacejay.vercel.app)

Project Description
A real-time auctioning platform so users can place register, login, place bids and view auctions.
Admin accounts can post new auctions close and open auctions and declare winners. The style is a minimilist design 
and user friendly so it is easy to get around and understand

Technologies Used
- React
- Firebase Authentication
- Firebase Firestore
- Firestore Security Rules
- CSS

Test Account Credentials
ADMIN ACCOUNT:
email: admin@gmail.com
password: Password123

TEST ACCOUNT (non-admin)
email: test@gmail.com
password: test123

Deployement Environment
- React Version: 18+
- Firebase SDK version: 9+
- Node.js version: 18+
- Package manager: npm
- tested browsers: Chrome

Clone & install
```bash
git clone https://github.com/nofacejay/SilentAuction.git
cd SilentAuction
npm install

Run in Dev
npm run Dev

Build for production
npm run buiild 

Enable email/password sign-in (Firebase)

create users and assign roles

In Firestore Database Data, create a users collection and add docs:
users/{ADMIN_UID} { email: "admin@gmail.com", role: "admin" }
users/{TEST_UID} { email: "test@gmail.com", role: "bidder" }

Paste and publish Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function myUid()      { return request.auth.uid; }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(myUid())).data.role == "admin";
    }

    match /users/{uid} {
      allow read: if isSignedIn() && (uid == myUid() || isAdmin());
      allow create: if isSignedIn() && (uid == myUid() || isAdmin());
      allow update: if isSignedIn() &&
        (isAdmin() || (uid == myUid() && request.resource.data.role == resource.data.role));
      allow delete: if isAdmin();
    }

    match /items/{itemId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (
        isSignedIn() &&
        !resource.data.isClosed &&
        request.resource.data.diff(resource.data).changedKeys()
          .hasOnly(['topBidAmount','topBidUserId','topBidUserEmail','updatedAt']) &&
        request.resource.data.topBidUserId == myUid() &&
        request.resource.data.topBidAmount is number &&
        request.resource.data.topBidAmount >= (
          resource.data.topBidAmount is number
            ? resource.data.topBidAmount + 1
            : 1
        )
      );

      match /bids/{bidId} {
        allow read: if isSignedIn();
        allow create: if isSignedIn() &&
          !get(/databases/$(database)/documents/items/$(itemId)).data.isClosed &&
          request.resource.data.amount is number &&
          request.resource.data.amount >= (
            (get(/databases/$(database)/documents/items/$(itemId)).data.topBidAmount is number)
              ? get(/databases/$(database)/documents/items/$(itemId)).data.topBidAmount + 1
              : 1
          ) &&
          request.resource.data.userId == myUid();
        allow update, delete: if false;
      }
    }

    // Optional: notifications collection for simulated emails
    match /notifications/{nid} {
      function myEmail() { return isSignedIn() ? request.auth.token.email : null; }
      allow read: if isAdmin() || (isSignedIn() && resource.data.to == myEmail());
      allow create, update, delete: if isAdmin();
    }
  }
}
