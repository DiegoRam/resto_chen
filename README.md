# Resto Chen

A Next.js application for restaurant table management and ordering.

## Features

- Table-specific pages with QR code access
- Call waiter functionality
- Menu viewing and food ordering
- Supabase integration for backend storage
- Real-time admin dashboard for order management

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/resto_chen.git
cd resto_chen
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials to `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Setup

1. Create a new Supabase project
2. Use the SQL editor in Supabase to run the commands in `database.sql`. This will:
   - Create the necessary tables (`waiter_calls` and `orders`)
   - Set up Row Level Security policies
   - Add triggers for timestamp updates
   - Optionally insert sample data for testing

Alternatively, you can manually create the tables as described below:

#### waiter_calls table

```sql
create table waiter_calls (
  id uuid default gen_random_uuid() primary key,
  table_id text not null,
  status text not null default 'pending',
  created_at timestamp with time zone default now() not null
);
```

#### orders table

```sql
create table orders (
  id uuid default gen_random_uuid() primary key,
  table_id text not null,
  status text not null default 'pending',
  total decimal(10, 2) not null,
  items jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
```

3. Set appropriate row security policies

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app` - Next.js application routes
  - `src/app/table/[id]` - Table-specific pages
  - `src/app/admin` - Admin dashboard and order management
- `src/components` - Reusable UI components
- `src/lib` - Utility functions and API integrations
- `database.sql` - SQL setup for Supabase

## Admin Features

The application includes an admin dashboard for restaurant staff:

- **Admin Dashboard**: Overview of restaurant metrics
- **Order Management**: Real-time tracking and updating of order status
- **User Management**: Staff account administration (placeholder)
- **Settings**: Restaurant configuration (placeholder)

Access the admin dashboard at `/admin` and the order management interface at `/admin/orders`.

## Technologies Used

- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN UI
- Supabase (Real-time Database)
- TanStack Table (for DataTable)

## License

This project is licensed under the MIT License.
