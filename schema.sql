-- Create tables

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB,
  last_login TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- FHE Groups table
CREATE TABLE fhe_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location TEXT,
  meeting_time TEXT,
  activity_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'less-active')),
  skills TEXT[],
  fhe_group_id UUID REFERENCES fhe_groups(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Callings table
CREATE TABLE callings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('filled', 'vacant')),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  sustained_date DATE,
  is_set_apart BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  description TEXT,
  attendees TEXT[],
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('meeting', 'activity', 'service', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Survey Responses table
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  record_number TEXT,
  birth_date DATE,
  email TEXT,
  phone TEXT,
  address TEXT,
  family_members TEXT,
  marital_status TEXT,
  previous_ward TEXT,
  previous_stake TEXT,
  move_in_date DATE,
  is_homeowner BOOLEAN NOT NULL DEFAULT FALSE,
  is_renting BOOLEAN NOT NULL DEFAULT FALSE,
  skills TEXT,
  interests TEXT,
  calling_preferences TEXT,
  additional_info TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- LCR Update Tasks table
CREATE TABLE lcr_update_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('calling_sustained', 'calling_set_apart', 'new_member', 'released_from_calling', 'other')),
  description TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_members_fhe_group_id ON members(fhe_group_id);
CREATE INDEX idx_callings_member_id ON callings(member_id);
CREATE INDEX idx_callings_status ON callings(status);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_lcr_update_tasks_completed ON lcr_update_tasks(completed);
CREATE INDEX idx_survey_responses_processed ON survey_responses(processed);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE callings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhe_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lcr_update_tasks ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can do everything
CREATE POLICY "Admins can do everything" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Similar policies for other tables...
