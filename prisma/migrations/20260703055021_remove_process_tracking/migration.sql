-- Drop process tracking columns from cases
ALTER TABLE "cases" DROP COLUMN IF EXISTS "processNumber",
                     DROP COLUMN IF EXISTS "processLastCheck",
                     DROP COLUMN IF EXISTS "processLastMovDate",
                     DROP COLUMN IF EXISTS "processLastMovCount",
                     DROP COLUMN IF EXISTS "processLastSummary";

-- Drop process interpret columns from plan_limits
ALTER TABLE "plan_limits" DROP COLUMN IF EXISTS "processInterpretEnabled",
                           DROP COLUMN IF EXISTS "maxProcessInterpretPerMonth";

-- Drop process interpret columns from usage_records
ALTER TABLE "usage_records" DROP COLUMN IF EXISTS "processInterpretThisMonth";

-- Drop index on processNumber if exists
DROP INDEX IF EXISTS "cases_processNumber_idx";
