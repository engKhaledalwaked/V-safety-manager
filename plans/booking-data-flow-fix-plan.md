# ÏØÉ ÅÕáÇÍ ãÔßáÉ ÚÏã ÙåæÑ ÇáÈíÇäÇÊ ÇáÔÎÕíÉ Ýí ÇáÏÇÔÈæÑÏ

## ÇáãÔßáÉ
ÚäÏãÇ íãáÁ ÇáÚãíá äãæÐÌ ÇáÍÌÒ æíÖÛØ ÅÑÓÇá¡ ÊÙåÑ ÈíÇäÇÊå Ýí ÇáÏÇÔÈæÑÏ áßä ÍÞæá (ÇáÇÓã¡ ÑÞã ÇáåæíÉ¡ ÇáÈÑíÏ ÇáÅáßÊÑæäí) ÊÙåÑ ßÝÇÑÛÉ.

## ÇáÊÍáíá ÇáÊÞäí

### ÊÏÝÞ ÇáÈíÇäÇÊ
1. **ÕÝÍÉ ÇáÍÌÒ (Booking.tsx)**: ÊÑÓá ÇáÈíÇäÇÊ ÚÈÑ `clientService.submitData()`
2. **ClientAPI.submitData()**: ÊÍÝÙ ÇáÈíÇäÇÊ Ýí Firebase
3. **DashboardPage**: ÊÓÊãÚ ááÊÛííÑÇÊ æÊÚÑÖ ÇáÈíÇäÇÊ

### ÇáãÔßáÉ ÇáãÍÊãáÉ
ÇáãÔßáÉ ÞÏ Êßæä Ýí ÃÍÏ ÇáäÞÇØ ÇáÊÇáíÉ:

1. **clientService ÛíÑ ãÊæÝÑ**: ÞÏ íßæä `clientService` ÛíÑ ãÚÑÝ ÈÔßá ÕÍíÍ Ýí Booking.tsx
2. **ÎØÃ Ýí ÇáÅÑÓÇá**: ÞÏ íßæä åäÇß ÎØÃ Ýí ÇÓÊÏÚÇÁ `submitData`
3. **ÎØÃ Ýí Firebase**: ÞÏ íßæä åäÇß ÎØÃ Ýí ÇáÇÊÕÇá Ãæ ÇáÍÝÙ

## ÎØæÇÊ ÇáÅÕáÇÍ

### ÇáÎØæÉ 1: ÅÖÇÝÉ ÓÌá ÅÖÇÝí ááÊÔÎíÕ
ÅÖÇÝÉ ÊÓÌíá Ýí Booking.tsx ááÊÍÞÞ ãä Ãä `clientService` ãÊæÝÑ æÃä ÇáÈíÇäÇÊ Êã ÅÑÓÇáåÇ.

### ÇáÎØæÉ 2: ÇáÊÍÞÞ ãä æÌæÏ clientService
Ýí ÏÇáÉ handleSubmit¡ ÇáÊÍÞÞ ãä Ãä `clientService` ãÊæÝÑ ÞÈá ÅÑÓÇá ÇáÈíÇäÇÊ.

### ÇáÎØæÉ 3: ÅÖÇÝÉ ãÚÇáÌÉ ááÃÎØÇÁ
ÅÖÇÝÉ ãÚÇáÌÉ ááÃÎØÇÁ Ýí ÍÇáÉ ÚÏã ÊæÝÑ `clientService`.

## ÇáßæÏ ÇáãÞÊÑÍ

```typescript
// Ýí Booking.tsx - ÏÇáÉ handleSubmit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // ÇáÊÍÞÞ ãä æÌæÏ clientService
  if (!clientService) {
    console.error('clientService is not available!');
    return;
  }
  
  const [inspectionDate, inspectionTime] = formData.inspectionDateTime.split(' ');
  
  const dataToSubmit = {
    name: formData.name,
    phoneNumber: formData.phone,
    nationalID: formData.nationalId,
    email: formData.email,
    nationality: formData.nationality,
    plate: `${formData.plateNumbers} ${formData.plateArabicLetters} ${formData.plateEnglishLetters}`,
    vehicleType: formData.vehicleType,
    region: formData.region,
    serviceType: formData.serviceType,
    hazardous: formData.hazardous,
    inspectionDate: inspectionDate,
    inspectionTime: inspectionTime,
  };
  
  console.log('Submitting data:', dataToSubmit);
  clientService.submitData(dataToSubmit);
  navigate('/billing', { state: { serviceType: formData.serviceType } });
};
```

## ÇáäÊíÌÉ ÇáãÊæÞÚÉ
- ÊÙåÑ ÇáÈíÇäÇÊ ÇáÔÎÕíÉ (ÇáÇÓã¡ ÑÞã ÇáåæíÉ¡ ÇáÈÑíÏ) Ýí äÇÝÐÉ "ÇáãÚáæãÇÊ ÇáÔÎÕíÉ" Ýí ÇáÏÇÔÈæÑÏ
- íãßä ÊÔÎíÕ Ãí ÎØÃ ãä ÎáÇá ÇáÓÌáÇÊ Ýí Console