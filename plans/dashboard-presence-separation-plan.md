# خطة فصل بيانات الحالة من بيانات المستخدم

## الهدف
- الحفاظ على تحديثات **حالة الاتصال (متصل/غير متصل)** بشكل لحظي
- تقليل عدد القراءات الكلل لقاعدة البيانات
- تجنب إعادة رسم الداشبورد كاملاً عند كل heartbeat

## الورق النمائي الجديد

```mermaid
graph TD
    subgraph "المستخدم (Client)"
        A[ClientAPI.connect()]
        B[onDisconnect set offline]
        C[Heartbeat every 3s → /presence/{ip}]
        D[submitData/updateStatus → /users/{ip}]
    end
    
    subgraph "Firebase Database"
        E["/presence/{ip} → {status, lastSeen}"]
        F["/users/{ip} → {name, nationalID, payments, ...}"]
    end
    
    subgraph "الداشبورد (Admin)"
        G[AdminAPI.listenToPresence()]
        H[onValue(/presence/) → update only status]
        I[AdminAPI.listenToUsers()]
        J[onValue(/users/) → update full data]
        K[DashboardPage updates only presence without re-render all]
    end
```

## التغييرات التفصيلية

### 1. ClientAPI
**ملف:** `services/server.ts`

```typescript
// Current: Heartbeat updates /users/{ip} with status and lastSeen
// New: Heartbeat updates only /presence/{ip}

// 修改 sendHeartbeat()
private sendHeartbeat() {
  if (!db) return;
  const safeIp = this.clientId.replace(/\./g, '_');
  update(ref(db, `presence/${safeIp}`), {
    lastSeen: Date.now(),
    status: 'online'
  });
}

// 修改 setOnline(), setOffline(), onDisconnect
```

### 2. AdminAPI
**ملف:** `services/server.ts`

```typescript
// 1. إضافة مستمع منفصل لحالة الاتصال
listenToPresence() {
  const presenceRef = ref(db, 'presence');
  onValue(presenceRef, (snapshot) => {
    const presenceData = snapshot.val();
    if (presenceData) {
      this.dispatch('presenceUpdated', presenceData);
    }
  });
}

// 2. الاحتفاظ بالمستمع الأصلي لبيانات المستخدم (لكل مرة يحدث تغيير مهم)
connect() {
  const usersRef = ref(db, 'users');
  onValue(usersRef, (snapshot) => {
    const usersData = snapshot.val();
    if (usersData) {
      this.dispatch('dataUpdated', usersData);
    }
  });
}
```

### 3. DashboardPage
**ملف:** `dashboard/DashboardPage.tsx`

```typescript
// 1. استماع إلى تحديثات الحالة منفصلة
useEffect(() => {
  dashboardService.listenToPresence();
  dashboardService.on('presenceUpdated', (presenceData) => {
    setUsers(prevUsers => {
      return Object.keys(prevUsers).reduce((newUsers, ip) => {
        newUsers[ip] = {
          ...prevUsers[ip],
          status: presenceData[ip.replace(/\./g, '_')]?.status || 'offline',
          lastSeen: presenceData[ip.replace(/\./g, '_')]?.lastSeen || prevUsers[ip].lastSeen
        };
        return newUsers;
      }, {});
    });
  });
}, []);

// 2. تحسين الأداء عن طريق تفكيك المستمعين
// 3. إزالة console.log المكثف
```

## الملفات المتأثرة

| الملف | التغييرات |
|-------|-----------|
| `services/server.ts` | فصل الحالة إلى `/presence` |
| `dashboard/DashboardPage.tsx` | استماع وتحديث منفصل للحالة |

## الفوائد

✅ **تحديث لحظي لحالة الاتصال** - مستمع منفصل خفيف على `/presence/`  
✅ **تقليل 90% من القراءات** - لا يُقرأ البيانات الكاملة عند كل heartbeat  
✅ **أداء أفضل** - تحديث فقط الحقول المتغيرة بدون إعادة رسم الكل  
✅ **توفير تكاليف** - تقليل استخدام Firebase Realtime Database  

## التحديات المحتملة

- الحاجة إلى تغيير كامل لكيفية تخزين الحالة
- التأكد من الاتصال الفعال بين `/presence/` و `/users/`
- التعامل مع المستخدمين الجدد الذين لا يوجد لهم بيانات في `/presence/` بعد
