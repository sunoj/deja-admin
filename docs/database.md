# Database Schema Documentation

## Voting Platform Tables

### proposals

Stores proposal information and metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Proposal title |
| content | TEXT | Proposal content |
| status | proposal_status | Current status (draft/active/completed/rejected) |
| created_by | UUID | Reference to auth.users(id) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| voting_start_date | TIMESTAMPTZ | Voting period start date |
| voting_end_date | TIMESTAMPTZ | Voting period end date |
| current_version | INTEGER | Current version number |

Indexes:
- `id` (PRIMARY KEY)
- `status` (for filtering by status)
- `created_at DESC` (for sorting by creation date)

### proposal_versions

Tracks version history of proposals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| proposal_id | UUID | Reference to proposals(id) |
| version_number | INTEGER | Sequential version number |
| content | TEXT | Version content |
| change_log | TEXT | Description of changes |
| created_at | TIMESTAMPTZ | Version creation timestamp |
| created_by | UUID | Reference to auth.users(id) |

Indexes:
- `id` (PRIMARY KEY)
- `proposal_id` (for filtering by proposal)
- `version_number DESC` (for sorting versions)

### proposal_comments

Stores comments on proposals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| proposal_id | UUID | Reference to proposals(id) |
| content | TEXT | Comment content |
| author_id | UUID | Reference to auth.users(id) |
| created_at | TIMESTAMPTZ | Comment timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| parent_id | UUID | Optional reference to parent comment |

Indexes:
- `id` (PRIMARY KEY)
- `proposal_id` (for filtering by proposal)
- `created_at DESC` (for sorting comments)
- `parent_id` (for nested comments)

### proposal_votes

Records votes on proposals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| proposal_id | UUID | Reference to proposals(id) |
| voter_id | UUID | Reference to auth.users(id) |
| support | BOOLEAN | Whether the vote is in support |
| voting_power | INTEGER | Voter's voting power |
| reason | TEXT | Optional voting reason |
| created_at | TIMESTAMPTZ | Vote timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

Indexes:
- `id` (PRIMARY KEY)
- `proposal_id` (for filtering by proposal)
- `voter_id` (for filtering by voter)
- UNIQUE(`proposal_id`, `voter_id`) (ensures one vote per user per proposal)

## Row Level Security (RLS) Policies

### proposals

- SELECT: Authenticated users can view all proposals
- INSERT: Authenticated users can create proposals (must be creator)
- UPDATE: Only the creator can update their proposals

### proposal_versions

- SELECT: Authenticated users can view all versions
- INSERT: Only the proposal creator can add versions

### proposal_comments

- SELECT: Authenticated users can view all comments
- INSERT: Authenticated users can add comments
- UPDATE: Only the author can update their comments

### proposal_votes

- SELECT: Authenticated users can view all votes
- INSERT/UPDATE: Authenticated users can vote on active proposals during voting period
- One vote per user per proposal enforced by unique constraint

## Triggers

- `update_updated_at_column()`: Automatically updates the `updated_at` timestamp on record changes
  - Applied to: proposals, proposal_comments, proposal_votes

## Enums

### proposal_status

Possible values:
- draft
- active
- completed
- rejected 