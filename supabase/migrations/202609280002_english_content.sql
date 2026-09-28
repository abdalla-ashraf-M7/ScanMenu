-- English content alongside the original Arabic menu fields.
alter table public.restaurants add column if not exists name_en text;
alter table public.restaurants add column if not exists tagline_en text;
alter table public.restaurants add column if not exists address_en text;
alter table public.categories add column if not exists name_en text;
alter table public.menu_items add column if not exists name_en text;
alter table public.menu_items add column if not exists description_en text;

update public.restaurants set
  name_en = 'Al Amal Kitchen',
  tagline_en = 'Egyptian comfort food, made with heart',
  address_en = 'El Gomhoreya Street, opposite El Sabeel Station'
where slug = 'al-amal' and name_en is null;

update public.categories set name_en = case id
  when 'c1000000-0000-0000-0000-000000000001' then 'Grill'
  when 'c1000000-0000-0000-0000-000000000002' then 'Pastries & Bread'
  when 'c1000000-0000-0000-0000-000000000003' then 'Main Dishes'
  when 'c1000000-0000-0000-0000-000000000004' then 'Drinks'
end
where id in ('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004')
  and name_en is null;

update public.menu_items set
  name_en = case id
    when 'd1000000-0000-0000-0000-000000000001' then 'Half Grilled Chicken'
    when 'd1000000-0000-0000-0000-000000000002' then 'Whole Grilled Chicken'
    when 'd1000000-0000-0000-0000-000000000003' then 'Charcoal-Grilled Kofta'
    when 'd1000000-0000-0000-0000-000000000004' then 'Grilled Stuffed Vine Leaves'
    when 'd1000000-0000-0000-0000-000000000005' then 'Feteer Meshaltet'
    when 'd1000000-0000-0000-0000-000000000006' then 'Cheese Feteer'
    when 'd1000000-0000-0000-0000-000000000007' then 'Egyptian Hawawshi'
    when 'd1000000-0000-0000-0000-000000000008' then 'Chicken & Potato Tray'
    when 'd1000000-0000-0000-0000-000000000009' then 'Stuffed Cabbage Rolls'
    when 'd1000000-0000-0000-0000-000000000010' then 'Molokhia with Chicken'
    when 'd1000000-0000-0000-0000-000000000011' then 'Fresh Sugarcane Juice'
    when 'd1000000-0000-0000-0000-000000000012' then 'Mint Lemonade'
  end,
  description_en = case id
    when 'd1000000-0000-0000-0000-000000000001' then 'With rice, potatoes and house sauce'
    when 'd1000000-0000-0000-0000-000000000002' then 'Serves three, with rice and salad'
    when 'd1000000-0000-0000-0000-000000000003' then 'Eight seasoned kofta skewers'
    when 'd1000000-0000-0000-0000-000000000004' then 'A generous portion, finished on the grill'
    when 'd1000000-0000-0000-0000-000000000005' then 'Flaky Egyptian pastry with traditional ghee'
    when 'd1000000-0000-0000-0000-000000000006' then 'Warm pastry filled with white cheese'
    when 'd1000000-0000-0000-0000-000000000007' then 'Spiced minced beef baked in bread'
    when 'd1000000-0000-0000-0000-000000000008' then 'A family-sized oven-baked favorite'
    when 'd1000000-0000-0000-0000-000000000009' then 'Rice-stuffed cabbage in tomato sauce'
    when 'd1000000-0000-0000-0000-000000000010' then 'Classic green soup with chicken and rice'
    when 'd1000000-0000-0000-0000-000000000011' then 'Chilled, freshly pressed'
    when 'd1000000-0000-0000-0000-000000000012' then 'A refreshing pitcher for three'
  end
where id in (select id from public.menu_items where restaurant_id = '11111111-1111-1111-1111-111111111111')
  and name_en is null;
