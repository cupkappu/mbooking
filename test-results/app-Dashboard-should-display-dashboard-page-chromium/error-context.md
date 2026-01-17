# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - heading "Accounting" [level=1] [ref=e5]
      - navigation [ref=e6]:
        - link "Dashboard" [ref=e7] [cursor=pointer]:
          - /url: /dashboard
        - link "Accounts" [ref=e8] [cursor=pointer]:
          - /url: /accounts
        - link "Journal" [ref=e9] [cursor=pointer]:
          - /url: /journal
        - link "Reports" [ref=e10] [cursor=pointer]:
          - /url: /reports
        - link "Settings" [ref=e11] [cursor=pointer]:
          - /url: /settings
    - main [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - heading "Dashboard" [level=1] [ref=e15]
          - paragraph [ref=e16]: Welcome to your accounting dashboard
        - generic [ref=e17]:
          - generic [ref=e18]:
            - heading "Total Assets" [level=3] [ref=e19]
            - paragraph [ref=e20]: $0.00
          - generic [ref=e21]:
            - heading "Total Liabilities" [level=3] [ref=e22]
            - paragraph [ref=e23]: $0.00
          - generic [ref=e24]:
            - heading "Net Worth" [level=3] [ref=e25]
            - paragraph [ref=e26]: $0.00
        - generic [ref=e27]:
          - heading "Recent Transactions" [level=3] [ref=e28]
          - paragraph [ref=e29]: No transactions yet. Create your first journal entry to get started.
  - alert [ref=e30]
```