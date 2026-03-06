# Luxor Full-stack Applications Challenge: Bidding system

This is my (Davis Sawali's) submission for the Luxor Full-stack Applications Challenge.

## Getting Started
1. Prerequisites
  Ensure you have Docker and Node.js installed. During the implementation of this project, the Node version being used was `v22.13.0` and NPM version was `v10.9.2`

2. Clone this repository
```bash
git clone <repository-url>
```

3. Spin up the Docker container for the PostgreSQL database

```bash 
docker compose up -d`
```  

4. Install dependencies
```bash
npm install
```

5. Run prisma commands to make sure your Database environment is set up correctly
```bash
npx prisma generate // Generate the Prisma Client
npx prisma db push // Push the schema to the database
npx prisma db seed // Seed the database with initial data
```

6. Run the development server
```bash
npm run dev
```

## Project Structure
```
src/
├── app/              # Next.js App Router (Pages & Server Actions)
│   ├── actions/      # Server Actions (CRUD operations)
│   ├── api/          # API Routes (if any)
│   └── page.tsx      # Main dashboard page
├── components/       # Reusable UI components
│   ├── collections/  # Collection-related components
│   ├── bids/         # Bid-related components
│   └── ui/           # Generic UI components (Modal, Button, etc.)
├── lib/              # Utility functions
│   └── db.ts         # Prisma client initialization
├── prisma/           # Prisma configuration
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Database seed script
└── types/            # TypeScript type definitions
```

## Questions and Answers

### 1. How would you monitor the application to ensure it is running smoothly?

I would use a combination of tools to monitor the application to ensure it is running smoothly. These tools include:

- **Health Check Probes** - One of the simplest ways we could check whether our database is accepting connections or not. (e.g. using pg_isready in our docker compose, not implemented in this coding challenge)

- **Sentry** - For real-time error reporting and session snapshots to help debug when a transaction fails. This will also let us (the developers) know which persona was active when a crash occurs, leading to easier debugging
- **Prometheus and Grafana** - A nice, open-source solution to track custom metrics (e.g. average time to resolve a collection's bidding, etc). Also offers alerting for when something takes too long to complete or resolve. Alternatively there's also something like ELK (ElasticSearch, Logstash, Kibana) for better log management.

- **Snyk and Dependabot** - These tools will ensure that your application code has no vulnerabilities and you (the developer) are always updated on CI build or on a PR. 

An example use case:
- A collection owner clicks 'accept' on a bid, the database updates the bid the have the status 'accepted', but a network timeout occurs before it can mark the other bids as rejected.
- We can monitor this with Sentry using custom tags for Transaction ID
- Set alert for partial transaction failures. If the atomic block in `prisma.$transaction` fails, Sentry will capture the snapshot of local states and variables.
- This will allow us to get an alert if a collection ends up with multiple accepted bids (not allowed)


### 2. How would you address scalability and performance?

For the system to scale and grow from ~100 collections to ~1M collections and millions of bids, there needs to be a few considerations.

- **Database Optimization** - As the DB size increases, the performance of queries will decrease. We can do things such as:
  1. Indexing: use an index to speed up queries. For example, we can create an index on collectionId to filter queries by status. Meaning we can find all 'pending' bids without scanning the entire table.
  2. Sharding: We can split the data into multiple databases, which can increase performance due to the database needing to scan less entries. We can shard based on a few things, collectionId, userId, etc.
  3. Read replicas: Bidding systems are often read-heavy (many people watching bids, fewer people making bids), we can offload read queries to read replicas to improve performance.

- **Caching** - Not making a query to the database is always faster. So we can consider a few things:
  1. Hot caching: Use something like Redis to cache the most active collections in memory (100 top collections for example). Doing so will improve responsiveness and reduce database load.
  2. CDN: We can use a CDN to cache static assets such as images, videos, etc. This will offload traffic from the database and your servers.

- **Concurency and High Traffic Scenarios** - Auctions usually have lower activity when it's at the start of a bid, and much higher activity at the tail end of a bidding war. We can consider a few things:
  1. Message Queues: Using something like RabbitMQ, Kafka, or SQS, we can push the 'bid' event to a queue and process it asynchronously. This will allow us to handle high traffic scenarios in a bidding war without 'losing' bid data while reducing the load from the UI.
  2. Load Balancing: Implement load balancing to distribute the load across multiple servers.
  3. Optimistic Concurrency Control: In Prisma, you can utilize a `version` field to implement concurrency control, where if another process changed the `version` field first, the update will fail gracefully, preventing double acceptance of a bid. This can also be done without using Prisma's `version` field, and is quite flexible to other implementations.

-**Frontend/UI optimizations** - We can also manipulate the UI to have a perceived performance boost and snapiness to the user experience.
  1. Lazy loading: We can implement lazy loading to only load data when needed, especially for large static assets.
  2. Cursor pagination: Using cursor based pagination instead of offset can make calls very efficient because it only fetches the next set of results after a certain identifier, making it a better choice for applications with large datasets.

### Trade-offs you had to choose when doing this challenge (the things you would do different with more time and resources)
Given the 24 hour window I had to complete the challenge, there are some conscious engineering decisions I had to make in order to deliver a fully functional product.

1. **API implementation** - Instead of using server actions for the API, I would opt for a completely separate implementation for the API. A decoupled RESTful/GraphQL API that is consumable by any front-end. In that case, if the application needs to scale to other platforms (mobile, tablets, etc), it will simply just consume the endpoints available.

2. **Authentication** - For this challenge, I opted to not implement an auth due to time constraints. Given more time and resources, I would implement a full authentication flow with proper permissions and privileges, MFA, etc. In this challenge, I opted for a mock data setup with a 'testing' component that helps test bids and collection management. <br><br>
During implementation and testing, I noticed that we couldn't test the 'accept'/'reject' bid functionality with some form of test accounts. Wihout needing to implement a full authentication flow, I wrote a small floating component that allows the user to switch between test users 'Alice', 'Bob', and 'Charlie' on the fly. In that way, the user can create a new collection as 'Alice' but place a bid as 'Bob'. The user can then change back to 'Alice' to accept or reject the bid.

3. **Concurrency** - For this implementation, I opted to use a basic Prisma `$transaction` to handle the `accept` and `reject` logic. This approach might be okay for low traffic, testing scenarios. But in a high concurrency event, using queues like BullMQ to handle to 'reject other bids' logic would allow the 'Accept' action to return a success message instantly while the actual processing happens asynchronously. <br><br>
There are also other methods to increase performance as I mentioned in previous sections and questions.

4. **Scalability and Performance** - Without rewriting the previous section on scalability and performance, I would implement the points I mentioned in the previous points above on **Database Optimization**, **Caching**, and **Concurrency**.