Endpoints:
`GET /pdf/users-report` for users-report
`GET /pdf/invoice` for invoice generation

Scalability Strategy:
Option 1:
If PDF generation happens infrequently, we can keep the report generation logic within the existing backend service. This keeps the architecture simple and easier to maintain and debug.

Option 2:
If report generation is asynchronous and may experience sudden traffic spikes, it would be better to offload it to a Lambda function so it can scale automatically based on demand.

Option 3:
If report generation is fully asynchronous and can be processed in bulk for multiple users at once, we can leverage ECS batch jobs to handle large-scale processing efficiently.