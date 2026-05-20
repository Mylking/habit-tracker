
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.seed_owner_habits()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  habits JSONB := '[]'::jsonb;
  names TEXT[] := ARRAY[
    'Wake up before 5:30am','Run and walk','Drink 3-4L water','Claud courses',
    'Hit gym','Eat 6 eggs','Do calisthenics','Post a reel on L n L',
    'Complete intern 7-8','2 leet code a day','Read book','Post 3 YouTube faceless vid',
    'Work on Jarvis','Sideshift UGC','Skinriari care 2-3 times','Debloat steps',
    'Keyboard practice','Sleep before 10 PM'
  ];
  may_data JSONB := jsonb_build_object(
    'Wake up before 5:30am', jsonb_build_array(5,6,7,8,9,10,11,12,13,14,15,16,17),
    'Run and walk', jsonb_build_array(5,6,7,8,9,10,11,12,13,14,15,16,17),
    'Drink 3-4L water', jsonb_build_array(4,5,6,7,8,9,10,11,12,13,14,16,17,18),
    'Claud courses', jsonb_build_array(6,9,12,14,17),
    'Hit gym', jsonb_build_array(4,6,7,9,10,11,13,14,16,17),
    'Eat 6 eggs', jsonb_build_array(4,5,6,7,8,9,10,11,12,13,15,16,18),
    'Do calisthenics', jsonb_build_array(4,5,6,8,9,10,11,12,14,16,17),
    'Post a reel on L n L', jsonb_build_array(5,7,10,13,16),
    'Complete intern 7-8', jsonb_build_array(6,8,10,13,15,17),
    '2 leet code a day', jsonb_build_array(5,7,8,10,11,13,14,15,17),
    'Read book', jsonb_build_array(4,5,7,8,10,11,12,14,16,18),
    'Post 3 YouTube faceless vid', jsonb_build_array(5,7,9,12,15,17),
    'Work on Jarvis', jsonb_build_array(6,9,12,15,17),
    'Sideshift UGC', jsonb_build_array(4,6,8,10,12,14,16,18),
    'Skinriari care 2-3 times', jsonb_build_array(4,5,6,7,8,9,10,11,12,13,14,15,16,17),
    'Debloat steps', jsonb_build_array(8,12,16),
    'Keyboard practice', jsonb_build_array(10,15),
    'Sleep before 10 PM', jsonb_build_array(5,6,7,8,9,10,11,13,14,15,17,18)
  );
  nm TEXT;
  comps JSONB;
BEGIN
  FOREACH nm IN ARRAY names LOOP
    comps := '{}'::jsonb;
    IF may_data ? nm THEN
      comps := jsonb_build_object('2026-05', may_data->nm);
    END IF;
    habits := habits || jsonb_build_array(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', nm,
      'timeTrackingEnabled', false,
      'createdAt', now()::text,
      'completions', comps
    ));
  END LOOP;
  RETURN jsonb_build_object(
    'habits', habits,
    'achievements', '[]'::jsonb,
    'settings', jsonb_build_object('theme','obsidian','globalTimeTracking',false,'lastVisited',''),
    'version','1.1.0'
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.seed_owner_habits() FROM PUBLIC, anon, authenticated;
