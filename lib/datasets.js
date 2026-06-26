// Five small, intentionally messy datasets. Each dataset has one primary table
// (loaded as `df` in Python and shown in Excel mode) plus optional extra tables
// (available by name in Python and SQL).

const sales = `date,product,category,region,units,revenue
2025-01-04,Notebook Pro,Electronics,West,3,2697
2025-01-05,Desk Lamp,Home,East,5,145
2025-01-06,Notebook Pro,Electronics,East,2,1798
2025-01-08,Coffee Maker,Home,West,4,356
2025-01-09,Wireless Mouse,Electronics,South,10,290
2025-01-09,Wireless Mouse,Electronics,South,10,290
2025-01-11,Desk Lamp,Home,west,3,87
2025-01-12,Standing Desk,Furniture,North,1,649
2025-01-14,Office Chair,Furniture,West,2,498
2025-01-15,Coffee Maker,Home,North,,267
2025-01-16,Notebook Pro,Electronics,South,1,899
2025-01-18,Monitor 27in,Electronics,East,4,1196
2025-01-19,Office Chair,Furniture,East,3,747
2025-01-21,Desk Lamp,Home,South,6,174
2025-01-22,Standing Desk,Furniture,West,2,1298
2025-01-24,Monitor 27in,Electronics,West,3,897
2025-01-25,Wireless Mouse,Electronics,North,8,232
2025-01-26,Coffee Maker,Home,East,5,445
2025-01-27,Notebook Pro,Electronics,West,2,1798
2025-01-28,Office Chair,Furniture,South,,249
2025-01-29,Monitor 27in,Electronics,North,2,598
2025-01-30,Standing Desk,Furniture,East,1,649
2025-01-31,Desk Lamp,Home,West,4,116
2025-01-31,Wireless Mouse,Electronics,East,5,145`;

const employees = `id,name,department,city,salary,years
101,Ayesha Rahman,Sales,Dhaka,52000,4
102,Tanvir Hasan,Engineering,Dhaka,84000,6
103,Mina Chowdhury,Sales,Chattogram,48000,2
104,Rafiq Islam,Engineering,Dhaka,91000,8
105,Sadia Karim,Marketing,Dhaka,N/A,3
106,Imran Hossain,Sales,Sylhet,55000,5
107,Nusrat Jahan,Engineering,Chattogram,78000,4
108,Farhan Ahmed,Marketing,Dhaka,61000,7
109,Lamia Akter,HR,Dhaka,45000,1
110,Shakil Khan,Sales,Dhaka,50000,3
110,Shakil Khan,Sales,Dhaka,50000,3
111,Tasnim Begum,Engineering,Sylhet,88000,9
112,Arif Mahmud,HR,Chattogram,N/A,2
113,Priya Saha,Marketing,Dhaka,58000,4
114,Junaid Alam,Engineering,Dhaka,95000,10
115,Rumana Haque,Sales,Chattogram,47000,1
116,Omar Faruk,Marketing,Sylhet,54000,3
117,Sharmin Sultana,Engineering,Dhaka,82000,5
118,Habib Rahman,HR,Dhaka,49000,4
119,Nadia Islam,Sales,Dhaka,53000,2`;

const survey = `response_id,product,region,score,recommend
R001,Notebook Pro,West,9,Yes
R002,Notebook Pro,East,7,Yes
R003,Coffee Maker,West,5,No
R004,Desk Lamp,South,8,Yes
R005,Coffee Maker,East,,No
R006,Notebook Pro,West,10,Yes
R007,Desk Lamp,East,6,No
R008,Office Chair,West,7,Yes
R009,Coffee Maker,South,4,No
R010,Notebook Pro,South,8,Yes
R011,Desk Lamp,West,9,Yes
R012,Office Chair,East,,Yes
R013,Coffee Maker,West,6,No
R014,Notebook Pro,East,9,Yes
R015,Desk Lamp,South,7,Yes
R016,Office Chair,South,5,No
R017,Coffee Maker,East,7,Yes
R018,Notebook Pro,West,8,Yes
R019,Office Chair,West,6,No
R020,Desk Lamp,East,8,Yes`;

const orders = `order_id,customer_id,order_date,status,amount
5001,C01,2025-02-01,delivered,120.50
5002,C03,2025-02-01,delivered,89.99
5003,C02,2025-02-02,cancelled,45.00
5004,C05,2025-02-03,delivered,210.75
5005,C01,2025-02-04,returned,120.50
5006,C04,2025-02-05,delivered,33.25
5007,C03,2025-02-06,delivered,
5008,C06,2025-02-07,delivered,150.00
5008,C06,2025-02-07,delivered,150.00
5009,C02,2025-02-08,delivered,77.40
5010,C07,2025-02-09,cancelled,19.99
5011,C05,2025-02-10,delivered,310.00
5012,C08,2025-02-11,delivered,64.30
5013,C01,2025-02-12,delivered,95.00
5014,C04,2025-02-13,returned,33.25
5015,C06,2025-02-14,delivered,
5016,C07,2025-02-15,delivered,142.80
5017,C03,2025-02-16,delivered,58.60
5018,C08,2025-02-17,delivered,71.20
5019,C02,2025-02-18,delivered,180.00
5020,C05,2025-02-19,cancelled,99.99
5021,C04,2025-02-20,delivered,47.75
5022,C01,2025-02-21,delivered,220.00
5023,C07,2025-02-22,delivered,88.10`;

const customers = `customer_id,name,city,segment
C01,Rina Stores,Dhaka,Retail
C02,Hasan Traders,Chattogram,Wholesale
C03,Mou Boutique,Dhaka,Retail
C04,Karim & Sons,Sylhet,Wholesale
C05,Pixel Cafe,Dhaka,Retail
C06,Green Mart,Khulna,Retail
C07,Alif Supplies,Chattogram,Wholesale
C08,Daily Needs,Dhaka,Retail`;

const marketing = `campaign,channel,month,spend,clicks,conversions
Spring Launch,Social,Jan,1200,3400,85
Spring Launch,Search,Jan,1800,2100,120
Spring Launch,Email,Jan,300,900,40
Brand Push,Social,Feb,1500,4100,95
Brand Push,Search,Feb,2000,2600,140
Brand Push,Email,Feb,350,,55
Retarget Q1,Social,Mar,900,2800,70
Retarget Q1,Search,Mar,1100,1500,88
Retarget Q1,Email,Mar,250,1100,62
Summer Sale,Social,Apr,1700,5200,130
Summer Sale,Search,Apr,2400,3000,175
Summer Sale,Email,Apr,400,1300,71
Loyalty Drive,Social,May,800,2200,48
Loyalty Drive,Search,May,950,,66
Loyalty Drive,Email,May,500,1600,90
Mid-Year Boost,Social,Jun,1300,3600,92
Mid-Year Boost,Search,Jun,1600,2300,118
Mid-Year Boost,Email,Jun,380,1250,67`;

export const DATASETS = {
  sales: {
    id: "sales",
    name: "Sales transactions",
    blurb: "One month of product sales. Watch out for a duplicate row, missing units, and a lowercase region.",
    tables: { sales },
    primary: "sales"
  },
  employees: {
    id: "employees",
    name: "Employee records",
    blurb: "An HR table with departments and salaries. Two salaries are N/A and one row is duplicated.",
    tables: { employees },
    primary: "employees"
  },
  survey: {
    id: "survey",
    name: "Customer survey",
    blurb: "Satisfaction scores from 1-10 by product and region. A couple of scores were left blank.",
    tables: { survey },
    primary: "survey"
  },
  orders: {
    id: "orders",
    name: "E-commerce orders",
    blurb: "Orders plus a customers table for joins. Includes a duplicate order and missing amounts.",
    tables: { orders, customers },
    primary: "orders"
  },
  marketing: {
    id: "marketing",
    name: "Marketing campaigns",
    blurb: "Spend, clicks and conversions per channel per month. Two click counts are missing.",
    tables: { marketing },
    primary: "marketing"
  }
};
