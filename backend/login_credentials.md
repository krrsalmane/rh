# 🔐 Login Credentials for Testing

## **Test Employee Accounts**

### **Jean Dupont**
- **Email**: `jean.dupont@test.com`
- **Password**: `password123`
- **Expected**: 2 leave requests (1 pending, 1 approved)

### **Marie Martin** 
- **Email**: `marie.martin@test.com`
- **Password**: `password123`
- **Expected**: 1 leave request (pending)

### **Pierre Bernard**
- **Email**: `pierre.bernard@test.com`
- **Password**: `password123`
- **Expected**: 0 leave requests

---

## 🧪 **Testing Instructions**

1. **Open Frontend**: Navigate to your React app (usually `http://localhost:5174`)
2. **Login**: Use any of the credentials above
3. **Navigate**: Go to "Congés" (Leave Requests) page
4. **Verify**: You should see employee-specific leave requests

---

## 📊 **Expected Results**

After successful login, each employee should see:

```
Jean Dupont → "Demandes de congés: 2 demandes"
Marie Martin → "Demandes de congés: 1 demande"  
Pierre Bernard → "Demandes de congés: 0 demandes"
```

---

## ✅ **Success Indicators**

- **No more "0 demandes" error**
- **Employee isolation working** (each sees only their requests)
- **Status filtering functional** (pending/approved/rejected tabs work)
- **Real-time updates** (status changes reflect immediately)

The login error you're seeing means the system is working - just need the correct credentials! 🎉
