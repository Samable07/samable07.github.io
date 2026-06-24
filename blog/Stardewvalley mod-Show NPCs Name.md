
> 下载：[Nexus](https://www.nexusmods.com/stardewvalley/mods/40565)

做着玩的Mod，主要作用是显示NPC和玩家名称。顺便做了多语言适配（呃就两种语言）
说到翻译，发布的一天内竟然有个巴西老哥帮我做了葡萄牙语还是西班牙语的翻译。当时看到还挺感动的...伟大啊。
关于兼容性，反正我自己也在用，没遇上什么很大的问题（基本没遇上问题）。

---

说实话，这还是我第一次~~（大概？）~~接触C#，在ai的帮助下做的。然后就不是很想更新了...呃也不知道做啥了。

这方面咱也不专业，基本就是参考Wiki慢慢弄的

[[info | <img src="https://img.icons8.com/?size=48&id=kNMmj1h9AoTk&format=png" style="height:1.2rem;"></img>**Wiki链接**
[Stardewvalleywiki | 模组:创建 SMAPI 模组](https://zh.stardewvalleywiki.com/%E6%A8%A1%E7%BB%84:%E5%88%9B%E5%BB%BA_SMAPI_%E6%A8%A1%E7%BB%84)
[Stardewvalleywiki | 模组:目录](https://zh.stardewvalleywiki.com/%E6%A8%A1%E7%BB%84:%E7%9B%AE%E5%BD%95)]]

这玩意儿最麻烦的其实是配置环境...

然后，我在下面把Mod文件“开源”了，如果有人需要的话（真的会有人需要嘛...）
当然这里不提供那些乱七八糟的配置文件。有问题可以问AI。

---

[[warning | 使用CC BY-NC-SA 4.0协议共享。*你可以随意使用，只要不拿来赚钱。*
This work is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">]]

SMAPI配置文件：
```json [manifest.json]
{
  "Name": "ShowNPCsName",
  "Author": "Samable",
  "Version": "1.0.2",
  "Description": "Show NPCs and players names above their heads, especially suitable for multiplayer gaming", 
  "UniqueID": "Samable.ShowNPCsName",
  "EntryDll": "ShowNPCsName.dll",
  "MinimumApiVersion": "4.0.0",
  "UpdateKeys": ["Nexus:40565"] 
}
```

Mod主文件：
> 我这里加了对 [`Generic Mod Config Menu (GMCM)`](https://www.nexusmods.com/stardewvalley/mods/5098) Mod的兼容
```C# [ModEntry.cs]
using System;
using System.Linq;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using StardewModdingAPI;
using StardewModdingAPI.Events;
using StardewValley;
using StardewValley.Characters;

namespace ShowNPCsName;

public class ModConfig
{
    public bool ShowNPCNameTooltip { get; set; } = true; // 默认显示
    public bool ShowPlayerNameTooltip { get; set; } = true; // 默认显示
    public bool ShowSelfNameTooltip { get; set; } = true; // 默认显示
    public string FontType { get; set; } = "smallFont"; // 默认smallFont
    public bool ShowPetNameTooltip { get; set; } = false; // 默认不显示

}
public class ModEntry : Mod
{    
    private ITranslationHelper i18n;
    private ModConfig Config; // 配置字段
    public override void Entry(IModHelper helper)
    {
        i18n = helper.Translation;
        Config = helper.ReadConfig<ModConfig>();
        // Monitor.Log("ShowNPCsName is ready.",LogLevel.Debug);
        helper.Events.Display.RenderedWorld += PrintNPCsName;
        helper.Events.Display.RenderedWorld += PrintPlayersName;
        helper.Events.GameLoop.GameLaunched += OnGameLaunched;
    }

        private void OnGameLaunched(object sender, GameLaunchedEventArgs e)
    {
        dynamic gmcmApi = Helper.ModRegistry.GetApi("spacechase0.GenericModConfigMenu");
        
        if (gmcmApi == null)
        {
            Monitor.Log("Generic Mod Config Menu未安装", LogLevel.Debug);
            return;
        }

        try
        {
            // 注册配置菜单
            gmcmApi.Register(
                mod: ModManifest,
                reset: (Action)(() => Config = new ModConfig()),
                save: (Action)(() => Helper.WriteConfig(Config))
            );
            
            gmcmApi.AddBoolOption(
                mod: ModManifest,
                name: (Func<string>)(() => i18n.Get("config.show-name.name")),
                tooltip: (Func<string>)(() => i18n.Get("config.show-name.tooltip")),
                getValue: (Func<bool>)(() => Config.ShowPlayerNameTooltip),
                setValue: (Action<bool>)((bool value) => Config.ShowPlayerNameTooltip = value)
            );
            gmcmApi.AddBoolOption(
                mod: ModManifest,
                name: (Func<string>)(() => i18n.Get("config.show-self-name.name")),
                tooltip: (Func<string>)(() => i18n.Get("config.show-self-name.tooltip")),
                getValue: (Func<bool>)(() => Config.ShowSelfNameTooltip),
                setValue: (Action<bool>)((bool value) => Config.ShowSelfNameTooltip = value)
            );
            gmcmApi.AddBoolOption(
                mod: ModManifest,
                name: (Func<string>)(() => i18n.Get("config.show-npc-name.name")),
                tooltip: (Func<string>)(() => i18n.Get("config.show-npc-name.tooltip")),
                getValue: (Func<bool>)(() => Config.ShowNPCNameTooltip),
                setValue: (Action<bool>)((bool value) => Config.ShowNPCNameTooltip = value)
            );
            gmcmApi.AddBoolOption(
                mod: ModManifest,
                name: (Func<string>)(() => i18n.Get("config.show-pet-name.name")),
                tooltip: (Func<string>)(() => i18n.Get("config.show-pet-name.tooltip")),
                getValue: (Func<bool>)(() => Config.ShowPetNameTooltip),
                setValue: (Action<bool>)((bool value) => Config.ShowPetNameTooltip = value)
            );
            gmcmApi.AddTextOption(
                mod: ModManifest,
                name: (Func<string>)(() => i18n.Get("config.font.name")),
                tooltip: (Func<string>)(() => i18n.Get("config.font.tooltip")),
                getValue: (Func<string>)(() => Config.FontType),
                setValue: (Action<string>)((string value) => Config.FontType = value),
                allowedValues: new string[] { "tinyFont", "smallFont", "dialogueFont" },
                formatAllowedValue: null
            );
            
            //Monitor.Log("成功注册GMCM配置菜单", LogLevel.Debug);
        }
        catch (Exception ex)
        {
            Monitor.Log($"注册GMCM菜单时出错: {ex.Message}", LogLevel.Warn);
        }
    }

    private void PrintNPCsName(object? sender, RenderedWorldEventArgs e)
    {
        if (!Config.ShowNPCNameTooltip) return;

        SpriteBatch spriteBatch = e.SpriteBatch;
        SpriteFont font = GetFontFromConfig(Config.FontType);

        GameLocation currentMap = Game1.currentLocation;

        // 使用foreach遍历当前地图上的所有角色
        foreach (NPC npc in currentMap.characters)
        {
            if (npc.IsMonster || npc.GetType() == typeof(Junimo) || npc.GetType() == typeof(JunimoHarvester))
                continue;// 不显示怪物、Junimo
            if (npc.GetType() == typeof(Pet) || npc.GetType() == typeof(Horse))
                if(!Config.ShowPetNameTooltip) continue; // 宠物
            
                // 获取NPC的基础信息
            string npcName = npc.displayName;
            
            // 获取NPC的像素坐标（精确位置）
            Vector2 npcPosition = npc.Position;

            Vector2 npcScreenPosition = new Vector2(
                npcPosition.X - Game1.viewport.X,
                npcPosition.Y - Game1.viewport.Y);

            Vector2 nameSize = font.MeasureString(npcName);
            
            // 计算文字框位置（在玩家头顶）
            // playerScreenPosition 是玩家脚底的位置
            float nameplateWidth = Math.Max(nameSize.X + 20, 120); // 最小宽度120
            float nameplateHeight = nameSize.Y + 10;
            
            float nameplateX = npcScreenPosition.X - 30;
            float nameplateY = npcScreenPosition.Y - 100;

            // 文字居中位置
            Vector2 textPos = new Vector2(
                nameplateX + (nameplateWidth - nameSize.X) / 2,
                nameplateY + (nameplateHeight - nameSize.Y) / 2
            );
            
            // 绘制文字阴影
            spriteBatch.DrawString(font, npcName, 
                textPos + new Vector2(1, 1), Color.Black);
            
            // 绘制文字主体
            Color nameColor = Color.White;
            spriteBatch.DrawString(font, npcName, textPos, nameColor);                     
            
        }
    }

    private void PrintPlayersName(object? sender, RenderedWorldEventArgs e)
    {

        if (!Config.ShowPlayerNameTooltip) return;

        SpriteBatch spriteBatch = e.SpriteBatch;
        SpriteFont font = GetFontFromConfig(Config.FontType);


        // 所有玩家
        foreach (Farmer farmer in Game1.getOnlineFarmers())
        {   
            if (Game1.player.currentLocation == farmer.currentLocation)
            {
                if (!Config.ShowSelfNameTooltip && Game1.player.UniqueMultiplayerID == farmer.UniqueMultiplayerID) continue;
                // 获取玩家核心信息
                Vector2 playerWorldPosition = farmer.Position;
                Vector2 playerScreenPosition = new Vector2(
                    playerWorldPosition.X - Game1.viewport.X,
                    playerWorldPosition.Y - Game1.viewport.Y);

                // 输出信息
                // Monitor.Log($"玩家: {farmer.Name},{farmer.UniqueMultiplayerID}", LogLevel.Info);
                // Monitor.Log($"所在地图: {farmer.currentLocation?.Name ?? "未知"}", LogLevel.Info);
                // Monitor.Log($"位置: X={playerPixelPosition.X}, Y={playerPixelPosition.Y}", LogLevel.Info);

                string playerName = farmer.Name;
                Vector2 nameSize = font.MeasureString(playerName);
                
                // 计算文字框位置（在玩家头顶）
                // playerScreenPosition 是玩家脚底的位置
                float nameplateWidth = Math.Max(nameSize.X + 20, 120); // 最小宽度120
                float nameplateHeight = nameSize.Y + 10;
                
                float nameplateX = playerScreenPosition.X - 30;
                float nameplateY = playerScreenPosition.Y - 125;
                
                // 背景
                // Rectangle nameplateRect = new Rectangle(
                //     (int)nameplateX,
                //     (int)nameplateY,
                //     (int)nameplateWidth,
                //     (int)nameplateHeight
                // );
                // spriteBatch.Draw(Game1.staminaRect, nameplateRect, Color.Black * 0.5f);
                
                // 文字居中位置
                Vector2 textPos = new Vector2(
                    nameplateX + (nameplateWidth - nameSize.X) / 2,
                    nameplateY + (nameplateHeight - nameSize.Y) / 2
                );
                
                // 绘制文字阴影
                spriteBatch.DrawString(font, playerName, 
                    textPos + new Vector2(1, 1), Color.Black);
                
                // 绘制文字主体
                Color nameColor = (Game1.player.UniqueMultiplayerID == farmer.UniqueMultiplayerID) ? Color.Gold : Color.White;
                spriteBatch.DrawString(font, playerName, textPos, nameColor);                
            }

        }
    }
    private SpriteFont GetFontFromConfig(string fontType)
    {
        return fontType switch
        {
            "tinyFont" => Game1.tinyFont,
            "dialogueFont" => Game1.dialogueFont,
            _ => Game1.smallFont // 默认或smallFont
        };
    }

}

```

i18n本地化翻译文件：
```json [default.json]
{
    "config.font.name": "Font Type",
    "config.font.tooltip": "Select the font for player names",
    "config.show-name.name": "Show Player's Name",
    "config.show-name.tooltip": "Enable to display names above players",
    "config.show-self-name.name":"Show Your Own Name",
    "config.show-self-name.tooltip":"Show your own name above your head (requires 'Show Player's Name to be enabled)",
    "config.show-npc-name.name":"Show NPC's Name",
    "config.show-npc-name.tooltip":"Enable to display names above NPC",
    "config.show-pet-name.name":"Show Pet's Name",
    "config.show-pet-name.tooltip":"Enable to display names above Pet"
}
```
```json [zh.json]
{
    "config.font.name": "字体类型",
    "config.font.tooltip": "显示玩家名字的字体",
    "config.show-name.name": "显示玩家名字",
    "config.show-name.tooltip": "在玩家头顶显示名字",
    "config.show-self-name.name":"显示自己的名字",
    "config.show-self-name.tooltip":"在自己的头顶显示名字（需要启用“显示玩家名字”）",
    "config.show-npc-name.name":"显示NPC名字",
    "config.show-npc-name.tooltip":"在NPC头顶显示名字",
    "config.show-pet-name.name":"显示宠物名字",
    "config.show-pet-name.tooltip":"在宠物头顶显示名字"
}
```