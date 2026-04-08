# NjangiPay Role Hierarchy - Complete and Fixed

## 👑 **Role Hierarchy Overview**

NjangiPay has a clear distinction between different admin levels and user types:

---

## 🏆 **Super Admin** (`super-admin`)
**Email**: `cheforgodwin01@gmail.com` (hardcoded)
**Dashboard**: `/super-admin`
**Access**: System-wide oversight and control

**Permissions:**
- ✅ All system access
- ✅ User management across all roles
- ✅ Platform configuration
- ✅ Banking partnerships
- ✅ System integrations
- ✅ Full audit access
- ✅ Can fix user roles

**Responsibilities:**
- Platform governance
- Strategic decisions
- System security
- Partner relationships

---

## 🏦 **Bank Admin** (`bank-admin`)
**Account Type**: `bank`
**Dashboard**: `/bank-dashboard`
**Access**: Banking operations and liquidity management

**Permissions:**
- ✅ Settlement pool management
- ✅ Transaction monitoring
- ✅ Compliance checking
- ✅ Risk assessment
- ✅ Banking partner management

**Responsibilities:**
- Liquidity oversight
- Banking operations
- Compliance reporting
- Partner account management

---

## 🛡️ **System Admin** (`admin`)
**Account Type**: `admin`
**Dashboard**: `/admin/communities`
**Access**: System administration and user management

**Permissions:**
- ✅ User management
- ✅ Community oversight
- ✅ System configuration
- ✅ Audit logs
- ✅ Fraud detection
- ✅ AI risk management

**Responsibilities:**
- System administration
- User moderation
- Content management
- System monitoring

---

## 👥 **Community Admin** (`community-admin`)
**Account Type**: `community-admin`
**Dashboard**: `/admin/communities`
**Access**: Community-specific administration

**Permissions:**
- ✅ Community management
- ✅ Member moderation
- ✅ Group oversight
- ✅ Community reports
- ✅ User support
- ✅ Community alerts

**Responsibilities:**
- Community governance
- Member management
- Group monitoring
- Support coordination

---

## 🏘️ **Community Representative** (`community`)
**Account Type**: `community`
**Dashboard**: `/groups`
**Access**: Group creation and community management

**Permissions:**
- ✅ Create new groups
- ✅ Manage own communities
- ✅ Member invitations
- ✅ Group performance tracking
- ✅ Community communication

**Responsibilities:**
- Group creation
- Community building
- Member engagement
- Group facilitation

---

## 👑 **Group Leader** (`leader`)
**Account Type**: `leader`
**Dashboard**: `/leader`
**Access**: Specific group leadership

**Permissions:**
- ✅ Group leadership
- ✅ Member management (within group)
- ✅ Payout management
- ✅ Loan approval
- ✅ Group settings
- ✅ Group reports

**Responsibilities:**
- Group facilitation
- Member coordination
- Payout distribution
- Loan oversight

---

## 🔍 **Auditor** (`auditor`)
**Account Type**: `auditor`
**Dashboard**: `/auditor`
**Access**: Compliance and audit functions

**Permissions:**
- ✅ Transaction logs
- ✅ Contribution verification
- ✅ Payout verification
- ✅ Audit reports
- ✅ Discrepancy tracking
- ✅ Fraud checking

**Responsibilities:**
- Financial auditing
- Compliance checking
- Discrepancy investigation
- Fraud prevention

---

## 👤 **Regular User** (`user`)
**Account Type**: `user` (default)
**Dashboard**: `/dashboard`
**Access: Personal participation and group activities

**Permissions:**
- ✅ Join groups
- ✅ Make contributions
- ✅ Apply for loans
- ✅ View personal wallet
- ✅ Group chat
- ✅ Receive notifications

**Responsibilities:**
- Active participation
- Timely contributions
- Loan repayment
- Community engagement

---

## 📊 **Role Comparison Matrix**

| Feature | Super Admin | Bank Admin | System Admin | Community Admin | Community Rep | Group Leader | Auditor | User |
|---------|-------------|------------|--------------|-----------------|---------------|--------------|---------|------|
| **System Config** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Bank Operations** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Community Management** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Group Creation** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Group Leadership** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Audit Access** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Loan Management** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Member Participation** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |

---

## 🔄 **Role Fix Tools**

### **1. Role Fix Tool**
- **Purpose**: Fix multiple users with incorrect roles
- **Access**: Super Admin only
- **Function**: Updates all users with `accountType: 'community'` and `role: 'admin'` to `role: 'community'`

### **2. User Role Fix Tool**
- **Purpose**: Fix individual users by username/email
- **Access**: Super Admin only
- **Function**: Updates specific user role based on their account type
- **Usage**: Enter username/email → Fix User Role

---

## ✅ **Key Distinctions Fixed**

1. **Community Admin ≠ System Admin**
   - Community Admin: Community-focused administration
   - System Admin: System-wide administration

2. **Community Rep ≠ Community Admin**
   - Community Rep: Creates and manages groups
   - Community Admin: Oversees communities and members

3. **Super Admin ≠ Any Other Admin**
   - Super Admin: Platform-level control
   - Other Admins: Domain-specific control

4. **Role Hierarchy Maintained**
   - Super Admin > System Admin > Community Admin > Community Rep > User
   - Bank Admin and Auditor are parallel specialized roles

The role hierarchy is now properly structured with clear distinctions and appropriate access levels! 🚀
