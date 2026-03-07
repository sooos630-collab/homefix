import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mmqjhvasdakuctzbvmyl.supabase.co";
const supabaseAnonKey = "sb_publishable_TSfSIU0BHJclXYEs6da77Q_ox8peGzB";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
