import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://mdcflmhcraqohrhevhib.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kY2ZsbWhjcmFxb2hyaGV2aGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTk4OTksImV4cCI6MjA4OTczNTg5OX0.c8kUyhBu482CMT9MaW5VXnY54_2elDepgnTknjJogrY'
);

async function check() {
    const { data, error } = await supabase.from('events').select('*');
    if (error) {
        console.error("Error fetching events:", error);
        return;
    }
    console.log(`Fetched ${data.length} events.`);
    data.forEach(e => {
        if (!e.location) {
            console.log("Event with missing/null location:", e.id, e.name, e.location);
        }
        if (!e.name) {
             console.log("Event with missing/null name:", e.id);
        }
        if (!e.event_date) {
            console.log("Event with missing/null event_date:", e.id, e.name);
        }
    });
    console.log("Done checking.");
}

check();
