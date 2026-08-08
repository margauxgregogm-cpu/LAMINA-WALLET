-- Lamina Fidelity now targets any business (barbers, nail salons, florists,
-- fast-food, etc.), not just restaurants -- a free-text category lets admin
-- group/filter the growing list instead of everything reading "restaurant".
alter table restaurants add column category text;
